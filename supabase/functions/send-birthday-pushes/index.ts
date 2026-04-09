/// <reference path="../deno.d.ts" />

// Edge Function: send-birthday-pushes (CRON Automático)
// Dispara notificações (Sininho + Celular) para os aniversariantes do dia

import { createClient } from 'jsr:@supabase/supabase-js@2'

// Roda diariamente às 12:00 UTC (09:00 BRT)
Deno.cron('send-birthday-push-daily', '0 12 * * *', async () => {
    console.log('⏰ Iniciando processamento de Push de Aniversários Diário (CRON)...');

    const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const todayUTC = new Date().toISOString().split('T')[0];

    // Busca os aniversários agendados EXATAMENTE para hoje (trigger_date)
    const { data: cards, error } = await supabase
        .from('birthday_cards')
        .select(`
            id,
            user_id,
            profiles (name)
        `)
        .eq('trigger_date', todayUTC);

    if (error || !cards) {
        console.error('❌ Erro consultando aniversariantes do dia:', error);
        return;
    }

    if (cards.length === 0) {
        console.log('ℹ️ Nenhum aniversariante agendado para hoje.');
        return;
    }

    let sentCount = 0;

    for (const card of cards) {
        const userId = card.user_id;
        const profileName = card.profiles?.name?.split(' ')[0] || 'Sócio(a)';
        
        const pushTitle = 'Feliz Aniversário! 🎉';
        const pushMessage = `Hoje celebramos a sua vida, ${profileName}`;

        // 1. Evitar duplicidade conferindo se já existe uma notificação gerada hoje para este usuário
        const { data: existingNotif } = await supabase
            .from('user_notifications')
            .select('id')
            .eq('user_id', userId)
            .eq('type', 'birthday')
            .gte('created_at', `${todayUTC}T00:00:00.000Z`)
            .maybeSingle();

        if (existingNotif) {
            console.log(`⏩ Ignorando ${profileName} (${userId}) - Push já foi enviado hoje.`);
            continue;
        }

        // 2. Gravar no BD (Para aparecer na aba de Notificações / Sininho do App)
        const { error: insertErr } = await supabase.from('user_notifications').insert({
            user_id: userId,
            type: 'birthday',
            title: pushTitle,
            message: pushMessage,
            action_url: 'NOTIFICATIONS',
            is_read: false,
        });

        if (insertErr) {
            console.error(`❌ Erro salvando notificação BD para ${userId}:`, insertErr);
            continue;
        }

        console.log(`💌 Acionando Push Worker (AWS) para: ${profileName}...`);

        // 3. Invocar a Edge Function raiz 'send-push' para disparar pro celular / OS do Usuário
        await supabase.functions.invoke('send-push', {
            body: {
                user_id: userId,
                title: pushTitle,
                body: pushMessage,
                url: 'NOTIFICATIONS',
                tag: `birthday-${userId}-${todayUTC}`,
                type: 'birthday',
            },
        });

        sentCount++;
    }

    console.log(`✅ Push Diário Concluído: ${sentCount} notificações de aniversário enviadas com sucesso!`);
});
