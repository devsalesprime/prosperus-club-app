// upload-reports.ts
// Script de upload em massa de relatórios HTML para os sócios
// Uso: npx tsx scripts/upload-reports.ts
//
// PRÉ-REQUISITO: 
//   1. Renomeie cada arquivo HTML para o e-mail do sócio correspondente
//      Exemplo: "dra.priscilatateishi@gmail.com.html"
//   2. Coloque os arquivos na pasta: ./relatorios_para_upload/
//   3. Certifique-se de que SUPABASE_SERVICE_ROLE_KEY está no .env

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';

// Carrega variáveis de ambiente
dotenv.config();

// CONFIGURAÇÃO
const FOLDER_PATH = path.resolve(__dirname, '..', 'relatorios_para_upload');
const BUCKET_NAME = 'member-reports'; // Bucket existente no projeto
const REPORT_TITLE = 'Relatório de Progresso - Fev/2026'; // Título padrão

// Validação de variáveis de ambiente
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('❌ Variáveis de ambiente não encontradas!');
    console.error('   Necessário: VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env');
    process.exit(1);
}

// Cliente Supabase com Service Role Key (bypassa RLS)
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

interface UploadResult {
    email: string;
    memberName: string;
    success: boolean;
    error?: string;
}

async function bulkUpload() {
    console.log('');
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║  📊 Upload em Massa - Relatórios de Progresso  ║');
    console.log('╚══════════════════════════════════════════════╝');
    console.log('');

    // 1. Verificar pasta
    if (!fs.existsSync(FOLDER_PATH)) {
        console.error(`❌ Pasta não encontrada: ${FOLDER_PATH}`);
        console.error(`   Crie a pasta "relatorios_para_upload" na raiz do projeto.`);
        process.exit(1);
    }

    // 2. Listar arquivos HTML
    const files = fs.readdirSync(FOLDER_PATH).filter(f => f.endsWith('.html'));

    if (files.length === 0) {
        console.error('❌ Nenhum arquivo .html encontrado na pasta.');
        console.error(`   Coloque os HTMLs renomeados como "email@do.socio.html" em:`);
        console.error(`   ${FOLDER_PATH}`);
        process.exit(1);
    }

    console.log(`📂 Encontrados ${files.length} arquivos HTML`);
    console.log(`📦 Bucket: ${BUCKET_NAME}`);
    console.log(`📝 Título padrão: ${REPORT_TITLE}`);
    console.log('');

    const results: UploadResult[] = [];
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const email = path.parse(file).name.toLowerCase().trim();
        const progress = `[${i + 1}/${files.length}]`;

        console.log(`${progress} Processando: ${email}`);

        // Validar formato de email básico
        if (!email.includes('@') || !email.includes('.')) {
            console.log(`   ⚠️  IGNORADO - Nome do arquivo não parece ser um e-mail: "${file}"`);
            skippedCount++;
            results.push({ email, memberName: '-', success: false, error: 'Nome inválido' });
            continue;
        }

        // 3. Buscar o sócio pelo e-mail
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, name, email')
            .ilike('email', email)
            .single();

        if (profileError || !profile) {
            console.log(`   ❌ Sócio NÃO encontrado para: ${email}`);
            errorCount++;
            results.push({ email, memberName: '-', success: false, error: 'E-mail não encontrado' });
            continue;
        }

        console.log(`   ✅ Sócio: ${profile.name}`);

        // 4. Verificar se já existe relatório com mesmo título para este sócio
        const { data: existing } = await supabase
            .from('member_progress_files')
            .select('id')
            .eq('member_id', profile.id)
            .eq('title', REPORT_TITLE)
            .maybeSingle();

        if (existing) {
            console.log(`   ⚠️  Relatório já existe para ${profile.name}, pulando...`);
            skippedCount++;
            results.push({ email, memberName: profile.name, success: false, error: 'Já existe' });
            continue;
        }

        // 5. Ler conteúdo do arquivo
        const fileContent = fs.readFileSync(path.join(FOLDER_PATH, file));
        const fileSize = fileContent.length;

        // 6. Upload para o Storage
        const storagePath = `${profile.id}/${Date.now()}_relatorio.html`;

        const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(storagePath, fileContent, {
                contentType: 'text/html',
                upsert: true
            });

        if (uploadError) {
            console.log(`   ❌ Erro no upload: ${uploadError.message}`);
            errorCount++;
            results.push({ email, memberName: profile.name, success: false, error: `Storage: ${uploadError.message}` });
            continue;
        }

        // 7. Obter URL pública
        const { data: { publicUrl } } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(storagePath);

        // 8. Salvar registro no banco
        const { error: dbError } = await supabase
            .from('member_progress_files')
            .insert({
                member_id: profile.id,
                title: REPORT_TITLE,
                file_url: publicUrl,
                file_type: 'HTML',
                file_size: fileSize,
                created_by: profile.id // Ou coloque o UUID do admin aqui
            });

        if (dbError) {
            console.log(`   ❌ Erro no banco: ${dbError.message}`);
            errorCount++;
            results.push({ email, memberName: profile.name, success: false, error: `DB: ${dbError.message}` });
        } else {
            console.log(`   ✨ Sucesso! Relatório vinculado a ${profile.name}`);
            successCount++;
            results.push({ email, memberName: profile.name, success: true });
        }
    }

    // Relatório final
    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log('                RELATÓRIO FINAL            ');
    console.log('═══════════════════════════════════════════');
    console.log(`  ✅ Sucessos:  ${successCount}`);
    console.log(`  ❌ Falhas:    ${errorCount}`);
    console.log(`  ⚠️  Ignorados: ${skippedCount}`);
    console.log(`  📊 Total:     ${files.length}`);
    console.log('═══════════════════════════════════════════');

    // Listar falhas para correção
    const failures = results.filter(r => !r.success);
    if (failures.length > 0) {
        console.log('');
        console.log('📋 Detalhes das falhas:');
        failures.forEach(f => {
            console.log(`   • ${f.email} → ${f.error}`);
        });
    }

    console.log('');
    console.log('🏁 Script finalizado!');
}

bulkUpload().catch(err => {
    console.error('💥 Erro fatal:', err);
    process.exit(1);
});
