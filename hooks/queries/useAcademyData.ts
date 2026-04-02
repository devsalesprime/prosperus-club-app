// React Query hook for Academy data
// Replaces 4-parallel-fetch useEffect in Academy.tsx

import { useQuery } from '@tanstack/react-query';
import { videoService } from '../../services/videoService';
import { Video, VideoProgress, VideoCategory } from '../../types';
import { QUERY_KEYS } from '../../utils/queryKeys';

export interface AcademyData {
    categories: VideoCategory[];
    allVideos: Video[];
    progressMap: Map<string, VideoProgress>;
    continueWatching: Video[];
    featuredVideo: Video | null;
}

export function useAcademyData(userId: string) {
    return useQuery<AcademyData>({
        queryKey: QUERY_KEYS.academyData(userId),
        queryFn: async (): Promise<AcademyData> => {
            const [cats, videos, progress, continueVideos] = await Promise.all([
                videoService.getCategories(),
                videoService.listVideos(),
                videoService.getAllUserProgress(userId),
                videoService.getContinueWatching(userId),
            ]);

            return {
                categories: cats,
                allVideos: videos,
                progressMap: progress,
                continueWatching: continueVideos,
                featuredVideo: videos.length > 0 ? videos[0] : null,
            };
        },
        staleTime: 15 * 60 * 1000,  // 15min — videos change rarely
        gcTime: 30 * 60 * 1000,     // 30min in cache after inactive
        enabled: !!userId,
    });
}
