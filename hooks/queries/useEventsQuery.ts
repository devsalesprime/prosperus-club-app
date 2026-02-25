// React Query hook for events
// Ready for future Agenda migration

import { useQuery } from '@tanstack/react-query';
import { eventService } from '../../services/eventService';
import { ClubEvent } from '../../types';
import { QUERY_KEYS } from '../../utils/queryKeys';

export function useEventsQuery(userId?: string) {
    return useQuery<ClubEvent[]>({
        queryKey: QUERY_KEYS.events(),
        queryFn: () => eventService.getEventsForUser(userId),
        staleTime: 5 * 60 * 1000, // 5min — events can change
        gcTime: 15 * 60 * 1000,
        enabled: !!userId,
    });
}
