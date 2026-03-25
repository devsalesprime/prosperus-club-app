// FAQContent.tsx — Inline FAQ with search and accordion
// Content updated for Smart Login flow (debounce, no "Continuar" button)

import React, { useState } from 'react'
import { Search, ChevronDown } from 'lucide-react'

interface FAQItem {
    q: string
    a: string | React.ReactNode
}

interface FAQSection {
    emoji: string
    title: string
    items: FAQItem[]
}

const FAQ_DATA: FAQSection[] = [
    {
        emoji: '🔐',
        title: 'Acesso e Login',
        items: [
            {
                q: 'Como faço para entrar na plataforma?',
                a: (
                    <ol className="list-decimal list-inside space-y-1 text-sm" style={{ color: '#8BA3B5' }}>
                        <li>Acesse o app pelo navegador ou pelo ícone instalado no celular</li>
                        <li>Na tela de login, digite seu <strong className="text-white">email</strong></li>
                        <li>Aguarde — o sistema verifica automaticamente em alguns instantes</li>
                        <li>Se cadastrado → o <strong className="text-white">campo de senha</strong> aparece automaticamente</li>
                        <li>Digite sua senha e toque em <strong className="text-white">"Entrar"</strong></li>
                    </ol>
                ),
            },
            {
                q: 'Sou sócio novo. Como ativo minha conta?',
                a: (
                    <ol className="list-decimal list-inside space-y-1 text-sm" style={{ color: '#8BA3B5' }}>
                        <li>Na tela de login, digite o <strong className="text-white">email cadastrado no contrato</strong> (o mesmo do HubSpot)</li>
                        <li>O sistema detecta automaticamente que é seu primeiro acesso</li>
                        <li>Os campos <strong className="text-white">"Criar senha"</strong> e <strong className="text-white">"Confirmar senha"</strong> aparecem</li>
                        <li>Crie uma senha (mínimo 6 caracteres) e confirme</li>
                        <li>Toque em <strong className="text-white">"Ativar Minha Conta"</strong> — login feito automaticamente</li>
                    </ol>
                ),
            },
            {
                q: 'Esqueci minha senha. O que faço?',
                a: 'Na tela de login, digite seu email e aguarde o campo de senha aparecer. Abaixo do campo de senha, toque em "Esqueci minha senha". Um link de recuperação será enviado para seu email. Clique no link, defina uma nova senha e pronto.',
            },
            {
                q: 'Posso usar a plataforma no celular?',
                a: 'Sim! O Prosperus Club é um PWA. No iOS: abra no Safari → toque Compartilhar → "Adicionar à Tela de Início". No Android: o navegador sugere a instalação automaticamente.',
            },
            {
                q: 'O app funciona sem internet?',
                a: 'Parcialmente. Páginas visitadas recentemente ficam em cache, mas chat, notificações e atualização de dados exigem conexão. Uma barra de aviso aparece quando você está offline.',
            },
        ],
    },
    {
        emoji: '🏠',
        title: 'Dashboard',
        items: [
            {
                q: 'O que vejo quando entro na plataforma?',
                a: 'O Dashboard é sua central de comando: banners com destaques do clube, acesso rápido aos módulos, widget de ROI com seu retorno atualizado e preview dos Rankings (Top 3).',
            },
            {
                q: 'Posso buscar qualquer coisa na plataforma?',
                a: 'Sim. A OmniSearch (barra de busca no topo) pesquisa em 8 categorias simultaneamente: Sócios, Eventos, Vídeos, Artigos, Notificações, Benefícios, Ferramentas e Conversas.',
            },
        ],
    },
    {
        emoji: '📅',
        title: 'Agenda de Eventos',
        items: [
            {
                q: 'Como vejo os próximos eventos?',
                a: (
                    <p className="text-sm" style={{ color: '#8BA3B5' }}>
                        Toque em <strong className="text-white">"Agenda"</strong> no menu. Os eventos são coloridos por tipo:{' '}
                        <span className="text-purple-400">● Presencial</span>{' '}
                        <span className="text-green-400">● Online</span>{' '}
                        <span className="text-red-400">● Gravado</span>
                    </p>
                ),
            },
            {
                q: 'Como vejo detalhes de um evento?',
                a: 'Toque em qualquer evento para abrir o modal de detalhes com data, horário, local, link do mapa (presenciais), link da transmissão (online), ata em PDF e materiais complementares.',
            },
            {
                q: 'Posso adicionar um evento ao Google Calendar ou Outlook?',
                a: 'Sim! No modal de detalhes, use os botões "📅 Google Calendar" ou "📅 Outlook" (baixa um arquivo .ics para importar).',
            },
        ],
    },
    {
        emoji: '🎓',
        title: 'Academy',
        items: [
            {
                q: 'O que é a Academy?',
                a: 'É a área de conteúdo educacional do clube — funciona como uma Netflix com vídeos individuais, séries com episódios e conteúdos de parceiros (YouTube, Vimeo, CursEduca).',
            },
            {
                q: 'Meu progresso é salvo?',
                a: 'Sim. O sistema registra automaticamente vídeos assistidos, progresso parcial em séries e tempo de execução.',
            },
            {
                q: 'O que são os Favoritos?',
                a: 'Você pode marcar qualquer vídeo como favorito (ícone ⭐) para acessá-lo rapidamente na aba "Meus Favoritos".',
            },
        ],
    },
    {
        emoji: '👥',
        title: 'Sócios (Member\'s Book)',
        items: [
            {
                q: 'O que é o Member\'s Book?',
                a: 'É o diretório de todos os sócios do clube. Você pode buscar por nome, empresa ou expertise, filtrar por área de atuação e ver o perfil completo de cada sócio.',
            },
            {
                q: 'O que é o benefício exclusivo?',
                a: 'Cada sócio pode cadastrar um benefício especial (desconto, condição diferenciada) oferecido exclusivamente para outros membros. Você vê esses benefícios ao abrir o perfil de qualquer sócio.',
            },
        ],
    },
    {
        emoji: '💼',
        title: 'Business Core',
        items: [
            {
                q: 'Como registro uma venda ou compra?',
                a: (
                    <ol className="list-decimal list-inside space-y-1 text-sm" style={{ color: '#8BA3B5' }}>
                        <li>Acesse "Meus Negócios" no Business Core</li>
                        <li>Toque em <strong className="text-white">"Registrar Negócio"</strong></li>
                        <li>Preencha: tipo (venda/compra), parceiro, valor, descrição</li>
                        <li>O parceiro recebe notificação para <strong className="text-white">confirmar ou contestar</strong></li>
                    </ol>
                ),
            },
            {
                q: 'O que é confirmar/contestar um negócio?',
                a: 'Quando alguém registra um negócio com você, você recebe uma notificação para ✅ Confirmar (entra no ROI) ou ❌ Contestar (vai para análise da administração).',
            },
            {
                q: 'O que é o ROI Dashboard?',
                a: 'Painel visual com seu retorno sobre o investimento no clube: valor total de negócios, indicações convertidas, gráfico de crescimento e widget resumo no Dashboard principal.',
            },
        ],
    },
    {
        emoji: '💬',
        title: 'Chat',
        items: [
            {
                q: 'Como envio uma mensagem para outro sócio?',
                a: 'Toque no ícone de mensagens no topo → "Nova Conversa" → busque o sócio pelo nome → selecione → digite e envie.',
            },
            {
                q: 'Vejo quando a pessoa responde?',
                a: 'Sim! O chat é em tempo real. Mensagens chegam instantaneamente e um indicador de digitação aparece quando a outra pessoa está escrevendo.',
            },
        ],
    },
    {
        emoji: '🔔',
        title: 'Notificações',
        items: [
            {
                q: 'Posso receber notificações no celular mesmo sem o app aberto?',
                a: 'Sim! Se o PWA estiver instalado e você tiver concedido permissão, receberá Push Notifications como um app nativo. Em iOS, o app precisa estar instalado pela Tela de Início.',
            },
        ],
    },
    {
        emoji: '❓',
        title: 'Problemas Comuns',
        items: [
            {
                q: 'Não consigo fazer login',
                a: 'Verifique se o email é o mesmo usado no contrato/HubSpot. Aguarde o sistema verificar automaticamente — o campo de senha aparece em alguns instantes. Se aparecer ✕ vermelho, seu email não está cadastrado — fale com o suporte. Toque em "Esqueci minha senha" abaixo do campo de senha para resetar.',
            },
            {
                q: 'A página não carrega ou fica em branco',
                a: 'Verifique sua conexão. Tente limpar o cache do navegador. Se instalou o PWA, tente desinstalar e reinstalar.',
            },
            {
                q: 'Não recebo notificações push no celular',
                a: 'Verifique se as notificações estão permitidas nas configurações do celular. O app precisa estar instalado como PWA. Em iOS, abra sempre pelo ícone na Tela de Início.',
            },
            {
                q: 'A foto do perfil não atualiza',
                a: 'Tamanho máximo: 5MB. Formatos aceitos: JPG, PNG. Após o upload, pode levar alguns segundos para atualizar em todas as telas.',
            },
        ],
    },
]

export function FAQContent() {
    const [search, setSearch] = useState('')
    const [openItem, setOpenItem] = useState<string | null>(null)
    const [openSection, setOpenSection] = useState<string | null>(FAQ_DATA[0].title)

    const filtered = FAQ_DATA.map(section => ({
        ...section,
        items: section.items.filter(
            item =>
                !search ||
                item.q.toLowerCase().includes(search.toLowerCase()) ||
                (typeof item.a === 'string' &&
                    item.a.toLowerCase().includes(search.toLowerCase()))
        ),
    })).filter(s => s.items.length > 0)

    return (
        <div className="px-4 pb-8 pt-3">
            {/* Search */}
            <div className="flex items-center gap-2 rounded-2xl px-3 py-3 mb-5"
                style={{ background: '#0D2E44', border: '1px solid #123F5B' }}>
                <Search size={15} className="shrink-0" style={{ color: '#8BA3B5' }} />
                <input
                    type="text"
                    placeholder="Buscar dúvida..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="bg-transparent text-sm text-white outline-none flex-1"
                    style={{ color: '#EDF4F7' }}
                />
            </div>

            {/* Sections */}
            <div className="space-y-2">
                {filtered.map(section => (
                    <div key={section.title} className="rounded-2xl overflow-hidden"
                        style={{ border: '1px solid #123F5B' }}>
                        {/* Section header */}
                        <button
                            onClick={() =>
                                setOpenSection(openSection === section.title ? null : section.title)
                            }
                            className="w-full flex items-center justify-between px-4 py-3"
                            style={{ background: '#0D2E44' }}
                        >
                            <span className="flex items-center gap-2 text-sm font-semibold text-white">
                                <span>{section.emoji}</span>
                                {section.title}
                            </span>
                            <ChevronDown
                                size={16}
                                className="transition-transform duration-200"
                                style={{
                                    color: '#8BA3B5',
                                    transform: openSection === section.title ? 'rotate(180deg)' : 'rotate(0deg)',
                                }}
                            />
                        </button>

                        {/* Items */}
                        {openSection === section.title && (
                            <div style={{ borderTop: '1px solid #123F5B' }}>
                                {section.items.map((item, idx) => (
                                    <div key={item.q} style={{ borderTop: idx > 0 ? '1px solid #0D2E44' : 'none' }}>
                                        <button
                                            onClick={() =>
                                                setOpenItem(openItem === item.q ? null : item.q)
                                            }
                                            className="w-full flex items-start gap-3 px-4 py-3 text-left"
                                        >
                                            <span
                                                className="font-bold text-base mt-0.5 shrink-0 w-4"
                                                style={{ color: '#FFDA71', lineHeight: 1 }}
                                            >
                                                {openItem === item.q ? '−' : '+'}
                                            </span>
                                            <p className={`text-sm leading-snug font-medium ${openItem === item.q ? 'text-white' : ''
                                                }`}
                                                style={{ color: openItem === item.q ? '#FFFFFF' : '#8BA3B5' }}>
                                                {item.q}
                                            </p>
                                        </button>
                                        {openItem === item.q && (
                                            <div className="px-4 pb-4 pl-11">
                                                {typeof item.a === 'string' ? (
                                                    <p className="text-sm leading-relaxed" style={{ color: '#8BA3B5' }}>
                                                        {item.a}
                                                    </p>
                                                ) : (
                                                    item.a
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Support CTA */}
            <div className="mt-6 rounded-2xl p-4 text-center"
                style={{ background: '#0D2E44', border: '1px solid #123F5B' }}>
                <p className="text-sm mb-3" style={{ color: '#8BA3B5' }}>
                    Não encontrou o que precisava?
                </p>
                <a
                    href="https://wa.me/5511918236211"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
                    style={{ background: '#FFDA71', color: '#031A2B' }}
                >
                    💬 Falar com o suporte
                </a>
            </div>
        </div>
    )
}
