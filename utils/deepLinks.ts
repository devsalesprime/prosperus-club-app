// utils/deepLinks.ts
// Mapeamento oficial das funções do app para rotas internas

export const DEEP_LINKS: Array<{group: string, items: Array<{label: string, value: string, icon: string}>}> = [
  {
    group: 'Dados & Analytics',
    items: [
      { label: 'Dashboard',           value: '/app/dashboard',          icon: '📊' },
      { label: 'Analytics',           value: '/app/analytics',          icon: '📈' },
    ]
  },
  {
    group: 'Conteúdo',
    items: [
      { label: 'Operações',           value: '/app/operacoes',          icon: '⚙️' },
    ]
  },
  {
    group: 'Sócios',
    items: [
      { label: 'Sócios',             value: '/app/socios',             icon: '👥' },
      { label: 'Aniversariantes',    value: '/app/aniversariantes',    icon: '🎂' },
      { label: 'Benefícios',         value: '/app/beneficios',         icon: '🎁' },
    ]
  },
  {
    group: 'Eventos',
    items: [
      { label: 'Eventos',            value: '/app/agenda',             icon: '📅' },
      { label: 'Relatórios',         value: '/app/relatorios',         icon: '📋' },
    ]
  },
  {
    group: 'Soluções',
    items: [
      { label: 'Soluções',           value: '/app/tools/solucoes',     icon: '🛠️' },
    ]
  },
  {
    group: 'ROI & Auditoria',
    items: [
      { label: 'ROI entre Sócios',   value: '/app/roi-socios',         icon: '🤝' },
      { label: 'Meu Crescimento',    value: '/app/roi-crescimento',    icon: '📈' },
    ]
  },
  {
    group: 'Sistema',
    items: [
      { label: 'Notificações',       value: '/app/notificacoes',       icon: '🔔' },
      { label: 'Mensagens',          value: '/app/chat',               icon: '💬' },
      { label: 'Tags / Categorias',  value: '/app/tags',               icon: '🏷️' },
    ]
  },
  {
    group: 'Suporte',
    items: [
      { label: 'Suporte',            value: '/app/suporte',            icon: '🆘' },
    ]
  },
]

// Helper — achatar para busca rápida
export const DEEP_LINKS_FLAT = DEEP_LINKS.flatMap(g =>
  g.items.map(item => ({ ...item, group: g.group }))
)

export function getLabelByDeepLink(value: string): string {
  return DEEP_LINKS_FLAT.find(l => l.value === value)?.label ?? value
}
