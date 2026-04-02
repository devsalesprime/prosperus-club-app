// TermsContent.tsx — Termos de Uso inline
// Full legal content rendered as styled React components

import React from 'react'

function Section({ num, title, children }: {
    num: string; title: string; children: React.ReactNode
}) {
    return (
        <div className="mb-8">
            <div className="flex items-baseline gap-2 mb-3">
                <span className="text-xs font-bold" style={{ color: '#FFDA71', opacity: 0.6 }}>
                    {num}
                </span>
                <h3 className="text-sm font-bold uppercase tracking-widest"
                    style={{ color: '#FFDA71' }}>
                    {title}
                </h3>
            </div>
            <div className="text-sm leading-relaxed space-y-3"
                style={{ color: '#EDF4F7' }}>
                {children}
            </div>
        </div>
    )
}

function Rules({ allowed, forbidden }: { allowed?: string[]; forbidden?: string[] }) {
    return (
        <div className="space-y-3">
            {allowed && (
                <div className="rounded-xl p-4" style={{ background: '#0D2E44', border: '1px solid #123F5B' }}>
                    <p className="text-xs font-semibold text-green-400 mb-2">✅ Você pode</p>
                    <ul className="space-y-1 text-xs" style={{ color: '#EDF4F7' }}>
                        {allowed.map((r, i) => <li key={i}>• {r}</li>)}
                    </ul>
                </div>
            )}
            {forbidden && (
                <div className="rounded-xl p-4" style={{ background: '#0D2E44', border: '1px solid #123F5B' }}>
                    <p className="text-xs font-semibold text-red-400 mb-2">🚫 Não é permitido</p>
                    <ul className="space-y-1 text-xs" style={{ color: '#EDF4F7' }}>
                        {forbidden.map((r, i) => <li key={i}>• {r}</li>)}
                    </ul>
                </div>
            )}
        </div>
    )
}

export function TermsContent() {
    return (
        <div className="px-5 pt-4 pb-12">

            <p className="text-xs mb-6" style={{ color: '#EDF4F7', opacity: 0.5 }}>
                Última atualização: 20 de fevereiro de 2026
            </p>

            <Section num="1." title="Aceitação">
                <p>
                    Ao acessar a plataforma <strong>Prosperus Club</strong>, você concorda
                    integralmente com estes Termos. Caso não concorde, interrompa o uso imediatamente.
                </p>
                <div className="rounded-xl p-4" style={{ background: '#0D2E44', border: '1px solid #123F5B' }}>
                    <p className="text-xs">Prosperus Club Ltda · CNPJ 57.378.551/0001-00</p>
                    <p className="text-xs">Rua Conceição de Monte Alegre, 198 — Conj. 82, São Paulo-SP</p>
                </div>
            </Section>

            <Section num="2." title="O que é a Plataforma">
                <p>
                    Plataforma exclusiva para membros associados do clube, com:
                    Dashboard, Agenda, Academy, Member's Book, Business Core,
                    Chat, Notificações, Galeria, Artigos e Tools Hub.
                </p>
            </Section>

            <Section num="3." title="Acesso e Cadastro">
                <p>
                    O acesso é restrito a <strong>membros com cadastro ativo no HubSpot</strong>.
                    Cada sócio é responsável pela confidencialidade da sua senha.
                    O compartilhamento de credenciais é proibido.
                </p>
            </Section>

            <Section num="4." title="Uso Aceitável">
                <Rules
                    allowed={[
                        'Usar todas as funcionalidades disponíveis',
                        'Registrar negócios e indicações com outros sócios',
                        'Enviar mensagens pelo chat',
                        'Assistir conteúdos da Academy',
                        'Baixar relatórios do Tools Hub',
                    ]}
                    forbidden={[
                        'Usar para fins ilícitos ou fraudulentos',
                        'Enviar spam, assédio ou conteúdo ofensivo',
                        'Registrar negócios fictícios ou inflar valores',
                        'Fazer scraping de dados de outros sócios',
                        'Compartilhar conteúdos da Academy com terceiros',
                        'Tentar invadir ou interferir na plataforma',
                    ]}
                />
            </Section>

            <Section num="5." title="Business Core">
                <p>
                    Os negócios registrados devem refletir <strong>transações reais</strong>.
                    O parceiro deve confirmar para que o valor entre no ROI.
                    Deals contestados são analisados pela administração.
                </p>
                <div className="rounded-xl p-4" style={{ background: '#0D2E44', border: '1px solid #123F5B' }}>
                    <p className="text-xs font-semibold text-red-400 mb-2">Manipulação de dados pode resultar em:</p>
                    <ul className="space-y-1 text-xs" style={{ color: '#EDF4F7' }}>
                        <li>• Invalidação dos registros</li>
                        <li>• Suspensão temporária do módulo</li>
                        <li>• Exclusão da plataforma em casos graves</li>
                    </ul>
                </div>
            </Section>

            <Section num="6." title="Chat e Conduta">
                <p>
                    Mensagens devem ser <strong>profissionais e respeitosas</strong>.
                    A administração pode visualizar, moderar e excluir mensagens
                    que violem estes Termos. Usuários podem ser bloqueados
                    temporária ou permanentemente.
                </p>
            </Section>

            <Section num="7." title="Academy e Propriedade Intelectual">
                <p>
                    Os conteúdos são de propriedade do Prosperus Club ou seus parceiros.
                    Você possui <strong>licença pessoal e intransferível</strong> enquanto
                    for membro ativo. É proibida a reprodução ou distribuição sem
                    autorização expressa.
                </p>
            </Section>

            <Section num="8." title="Suspensão e Encerramento">
                <p>
                    Podemos suspender o acesso por violação destes Termos, inadimplência
                    ou encerramento da associação. O sócio pode solicitar o encerramento
                    da conta pelo suporte — os dados são mantidos por 30 dias para
                    auditoria e depois excluídos.
                </p>
            </Section>

            <Section num="9." title="Responsabilidade">
                <p>
                    O Prosperus Club <strong>não se responsabiliza</strong> por negócios
                    realizados entre sócios. A plataforma é uma ferramenta de registro
                    e acompanhamento — não é parte em nenhuma transação.
                </p>
            </Section>

            <Section num="10." title="Foro e Lei Aplicável">
                <p>
                    Estes Termos são regidos pela legislação brasileira.
                    Fica eleito o foro da comarca de <strong>São Paulo/SP</strong>.
                </p>
            </Section>

            <Section num="11." title="Contato">
                <div className="rounded-xl p-4" style={{ background: '#0D2E44', border: '1px solid #123F5B' }}>
                    <p className="text-xs">Email: tecnologia@salesprime.com.br</p>
                    <p className="text-xs mt-1" style={{ opacity: 0.7 }}>
                        Ou via botão de suporte (WhatsApp) na plataforma
                    </p>
                </div>
            </Section>

        </div>
    )
}
