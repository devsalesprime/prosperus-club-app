// ============================================
// COPY CENTRALIZADO — Textos reutilizáveis
// ============================================
// Todos os textos de empty states, feedback e erros.
// Importar: import { COPY } from '../utils/copy';

export const COPY = {
    empty: {
        notifications: 'Tudo em dia. Novidades aparecem aqui.',
        conversations: 'Suas conversas aparecem aqui. Comece pelo perfil de qualquer sócio.',
        events: 'Novos encontros são publicados regularmente. Você será notificado.',
        members: 'Nenhum sócio encontrado. Tente outro termo.',
        deals: 'Registre negócios fechados para acompanhar seu ROI.',
        gallery: 'Novos álbuns são publicados após cada evento.',
        academy: 'Novo conteúdo é adicionado regularmente.',
        referrals: 'Indique sócios e acompanhe suas indicações aqui.',
    },
    feedback: {
        rsvpConfirmed: 'Presença confirmada. Nos vemos lá.',
        rsvpCancelled: 'Confirmação cancelada.',
        profileUpdated: 'Perfil atualizado.',
        dealRegistered: 'Negócio registrado com sucesso.',
        messageSent: 'Mensagem enviada.',
        notificationCleared: 'Notificações limpas.',
    },
    errors: {
        generic: 'Algo deu errado. Toque para tentar novamente.',
        network: 'Sem conexão. Verifique sua internet.',
        load: 'Não foi possível carregar.',
    },
    loading: {
        members: 'Buscando sócios...',
        conversations: 'Buscando conversas...',
        notifications: 'Carregando avisos...',
        events: 'Carregando eventos...',
        deals: 'Carregando negócios...',
    },
} as const;
