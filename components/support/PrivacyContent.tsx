// PrivacyContent.tsx — Política de Privacidade inline
// Full legal content rendered as styled React components

import React from 'react'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="mb-8">
            <h3 className="text-sm font-bold uppercase tracking-widest mb-3"
                style={{ color: '#FFDA71' }}>
                {title}
            </h3>
            <div className="text-sm leading-relaxed space-y-3"
                style={{ color: '#EDF4F7' }}>
                {children}
            </div>
        </div>
    )
}

function Table({ rows }: { rows: string[][] }) {
    return (
        <div className="overflow-x-auto -mx-1">
            <table className="w-full text-xs border-collapse">
                <tbody>
                    {rows.map((row, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #052B48' }}>
                            {row.map((cell, j) => (
                                <td key={j} className="py-2 px-3 align-top"
                                    style={{
                                        color: j === 0 ? '#FFDA71' : '#EDF4F7',
                                        fontWeight: j === 0 ? 600 : 400,
                                        background: i % 2 === 0 ? '#031726' : 'transparent',
                                    }}>
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export function PrivacyContent() {
    return (
        <div className="px-5 pt-4 pb-12">

            <p className="text-xs mb-6" style={{ color: '#EDF4F7', opacity: 0.5 }}>
                Última atualização: 20 de fevereiro de 2026
            </p>

            <Section title="1. Introdução">
                <p>
                    Esta Política descreve como o <strong>Prosperus Club</strong> coleta, utiliza,
                    armazena e protege seus dados pessoais, em conformidade com a{' '}
                    <strong>LGPD (Lei nº 13.709/2018)</strong>.
                </p>
                <div className="rounded-xl p-4 space-y-1" style={{ background: '#031726', border: '1px solid #052B48' }}>
                    <p className="text-xs font-semibold" style={{ color: '#FFDA71' }}>Controlador dos Dados</p>
                    <p>Prosperus Club Ltda · CNPJ 57.378.551/0001-00</p>
                    <p>Rua Conceição de Monte Alegre, 198 — Conj. 82</p>
                    <p>Cidade Monções · São Paulo-SP · CEP 04563-060</p>
                    <p>DPO: Fábio Soares · tecnologia@salesprime.com.br</p>
                </div>
            </Section>

            <Section title="2. Dados que Coletamos">
                <p className="font-semibold text-white">Fornecidos por você:</p>
                <Table rows={[
                    ['Nome completo', 'Cadastro / Perfil', 'Obrigatório'],
                    ['Email', 'Login', 'Obrigatório'],
                    ['Telefone / Cargo / Empresa', 'Perfil', 'Opcional'],
                    ['Foto, Bio, Redes sociais', 'Perfil', 'Opcional'],
                    ['O que vende / O que precisa', 'Perfil', 'Opcional'],
                    ['Benefício exclusivo', 'Perfil', 'Opcional'],
                    ['Mensagens de chat', 'Chat', '—'],
                    ['Negócios e indicações', 'Business Core', '—'],
                ]} />
                <p className="font-semibold text-white mt-4">Coletados automaticamente:</p>
                <Table rows={[
                    ['Endereço IP', 'Segurança e logs'],
                    ['Dispositivo / Navegador / SO', 'Otimização'],
                    ['Páginas visitadas / Sessão', 'Engajamento'],
                    ['Tokens Push Notification', 'Notificações'],
                ]} />
            </Section>

            <Section title="3. Como Usamos seus Dados">
                <Table rows={[
                    ['Autenticação', 'Execução de contrato'],
                    ['Exibição no Member\'s Book', 'Consentimento'],
                    ['Registro de negócios', 'Execução de contrato'],
                    ['Push notifications', 'Consentimento'],
                    ['Analytics de uso', 'Legítimo interesse'],
                    ['Moderação do chat', 'Legítimo interesse'],
                ]} />
                <div className="rounded-xl p-4 mt-3" style={{ background: '#031726', border: '1px solid #052B48' }}>
                    <p className="font-semibold text-white mb-2">Nunca usamos seus dados para:</p>
                    <ul className="space-y-1 text-xs" style={{ color: '#8BA3B5' }}>
                        <li>• Venda a terceiros</li>
                        <li>• Publicidade direcionada externa</li>
                        <li>• Perfilamento discriminatório</li>
                    </ul>
                </div>
            </Section>

            <Section title="4. Compartilhamento">
                <p className="font-semibold text-white">Visível para outros sócios:</p>
                <p className="text-xs" style={{ color: '#EDF4F7', opacity: 0.8 }}>
                    Nome, foto, cargo, empresa, bio, redes sociais, o que vende/precisa,
                    benefício exclusivo, tags e vídeo pitch.
                </p>
                <p className="font-semibold text-white mt-4">Subprocessadores:</p>
                <Table rows={[
                    ['Supabase', 'Banco de dados', 'AWS (EUA)'],
                    ['HubSpot', 'Validação de cadastro', 'EUA'],
                    ['Google Photos', 'Galerias (sem dados pessoais)', 'EUA'],
                    ['CursEduca', 'Player de vídeo (ID anônimo)', 'Brasil'],
                ]} />
                <p className="font-bold" style={{ color: '#FFDA71' }}>
                    Não vendemos, alugamos ou comercializamos seus dados em nenhuma circunstância.
                </p>
            </Section>

            <Section title="5. Segurança">
                <Table rows={[
                    ['Criptografia em trânsito', 'HTTPS / TLS'],
                    ['Criptografia em repouso', 'AES-256'],
                    ['Controle por linha (RLS)', 'Cada usuário acessa só seus dados'],
                    ['Senhas', 'bcrypt hash — nunca em texto'],
                    ['Tokens JWT', 'Expiração automática'],
                ]} />
            </Section>

            <Section title="6. Seus Direitos (LGPD)">
                <Table rows={[
                    ['Acesso', 'Ver cópia dos seus dados'],
                    ['Correção', 'Corrigir dados incorretos'],
                    ['Eliminação', 'Excluir dados tratados com consentimento'],
                    ['Portabilidade', 'Receber dados em formato estruturado'],
                    ['Revogação', 'Retirar consentimento a qualquer momento'],
                ]} />
                <div className="rounded-xl p-4" style={{ background: '#031726', border: '1px solid #052B48' }}>
                    <p className="text-xs font-semibold mb-1" style={{ color: '#FFDA71' }}>Como exercer seus direitos</p>
                    <p className="text-xs">Email: tecnologia@salesprime.com.br</p>
                    <p className="text-xs">Prazo de resposta: até 15 dias úteis</p>
                    <p className="text-xs mt-2" style={{ opacity: 0.7 }}>
                        Você também pode registrar reclamação na ANPD: gov.br/anpd
                    </p>
                </div>
            </Section>

            <Section title="7. Push Notifications">
                <p>
                    O envio requer <strong>consentimento explícito</strong> — você autoriza
                    ao instalar o PWA e aceitar as notificações.
                </p>
                <p className="text-xs" style={{ opacity: 0.8 }}>
                    Para desativar: Configurações do celular → Notificações → Prosperus Club → Desativar.
                </p>
            </Section>

            <Section title="8. Contato">
                <div className="rounded-xl p-4" style={{ background: '#031726', border: '1px solid #052B48' }}>
                    <p>DPO: Fábio Soares</p>
                    <p>Email: tecnologia@salesprime.com.br</p>
                    <p>Endereço: Rua Conceição de Monte Alegre, 198 — Conj. 82, São Paulo-SP</p>
                </div>
            </Section>

        </div>
    )
}
