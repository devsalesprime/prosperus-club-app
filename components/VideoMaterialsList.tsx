// ============================================
// VideoMaterialsList.tsx — Sócio-facing component
// ============================================
// Shows complementary materials (PDFs, slides, images) below the video player
// Replicates the pattern from EventDetailsModal → "Materiais complementares"

import React, { useEffect, useState } from 'react';
import { Download, FileText, Image, Paperclip } from 'lucide-react';
import { videoService, VideoMaterial } from '../services/videoService';

const GOLD   = '#FFDA71';
const CARD   = '#0D2E44';
const GREY   = '#A8B4BC';
const BORDER = '#123F5B';

function getIcon(type: string) {
    if (type === 'pdf')       return <FileText size={16} color="#EF4444" />;
    if (type.includes('ppt')) return <FileText size={16} color="#F97316" />;
    if (type === 'image')     return <Image size={16} color="#3B82F6" />;
    return <Paperclip size={16} color={GREY} />;
}

function formatBytes(b: number) {
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
    return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

interface Props {
    videoId: string;
}

export const VideoMaterialsList: React.FC<Props> = ({ videoId }) => {
    const [materials, setMaterials] = useState<VideoMaterial[]>([]);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        videoService.getVideoMaterials(videoId).then(data => {
            if (!cancelled) { setMaterials(data); setLoading(false); }
        });
        return () => { cancelled = true; };
    }, [videoId]);

    const handleDownload = async (mat: VideoMaterial) => {
        if (downloading) return;
        setDownloading(mat.id);
        window.open(mat.file_url, '_blank', 'noopener,noreferrer');
        setTimeout(() => setDownloading(null), 1200);
    };

    // Don't render if no materials (after loading completes)
    if (!loading && materials.length === 0) return null;

    return (
        <div style={{ marginTop: 20 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Paperclip size={16} color={GOLD} />
                <span style={{ color: GOLD, fontSize: 14, fontWeight: 600 }}>
                    Materiais complementares
                </span>
                {!loading && (
                    <span style={{
                        fontSize: 11, color: GREY,
                        background: '#0A1828', padding: '2px 8px', borderRadius: 10,
                    }}>
                        {materials.length}
                    </span>
                )}
            </div>

            {/* Skeleton */}
            {loading && (
                <div style={{
                    background: CARD, borderRadius: 10, height: 52,
                    border: `1px solid ${BORDER}`, opacity: 0.4,
                }} />
            )}

            {/* Materials list */}
            {!loading && materials.map(mat => (
                <div
                    key={mat.id}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 14px',
                        marginBottom: 8,
                        background: CARD,
                        borderRadius: 10,
                        border: `1px solid ${BORDER}`,
                    }}
                >
                    {/* Icon */}
                    <div style={{
                        width: 36, height: 36, borderRadius: 8,
                        background: '#0A1828',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                    }}>
                        {getIcon(mat.file_type)}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                            fontSize: 13, fontWeight: 600, color: '#FCF7F0',
                            margin: '0 0 2px',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                            {mat.title}
                        </p>
                        <p style={{ fontSize: 11, color: GREY, margin: 0 }}>
                            {mat.file_type.toUpperCase()} · {formatBytes(mat.file_size)}
                        </p>
                    </div>

                    {/* Download button */}
                    <button
                        onClick={() => handleDownload(mat)}
                        disabled={downloading === mat.id}
                        style={{
                            flexShrink: 0,
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '7px 12px', borderRadius: 8,
                            border: `1px solid ${GOLD}`, background: 'transparent',
                            color: GOLD, fontSize: 12, fontWeight: 600,
                            cursor: downloading === mat.id ? 'not-allowed' : 'pointer',
                            opacity: downloading === mat.id ? 0.5 : 1,
                            WebkitTapHighlightColor: 'transparent',
                        }}
                    >
                        <Download size={13} color={GOLD} />
                        {downloading === mat.id ? '...' : 'Baixar'}
                    </button>
                </div>
            ))}
        </div>
    );
};
