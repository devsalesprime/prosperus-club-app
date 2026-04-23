// ============================================
// UPLOAD SERVICE
// ============================================
// Envia arquivos para o servidor próprio (prosperusclub.com.br/pdf/)
// Auth: Supabase JWT token (validated by upload.php)

import { supabase } from '../lib/supabase';

export interface UploadResult {
    success: boolean;
    url?: string;
    filename?: string;
    original?: string;
    size?: number;
    mime?: string;
    extension?: string;
    error?: string;
}

export type UploadProgressCallback = (percent: number) => void;

class UploadService {
    private getEndpoint(): string {
        const isDev = import.meta.env.DEV;
        if (isDev) {
            // Dev: direct to Node.js upload server
            return 'http://localhost:3010/api/upload';
        }
        // Prod: Nginx proxies /api/upload → localhost:3010
        return 'https://prosperusclub.com.br/api/upload';
    }

    /**
     * Upload a file to the server
     * Uses XMLHttpRequest for progress tracking
     */
    async uploadFile(
        file: File,
        onProgress?: UploadProgressCallback
    ): Promise<UploadResult> {
        try {
            // Get Supabase session token
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) {
                return { success: false, error: 'Sessão expirada. Faça login novamente.' };
            }

            // Validate on client side first
            const validation = this.validateFile(file);
            if (!validation.valid) {
                return { success: false, error: validation.error };
            }

            const formData = new FormData();
            formData.append('file', file);

            // Use XMLHttpRequest for progress tracking
            return new Promise<UploadResult>((resolve) => {
                const xhr = new XMLHttpRequest();

                // Progress
                if (onProgress) {
                    xhr.upload.addEventListener('progress', (e) => {
                        if (e.lengthComputable) {
                            const percent = Math.round((e.loaded / e.total) * 100);
                            onProgress(percent);
                        }
                    });
                }

                // Complete
                xhr.addEventListener('load', () => {
                    try {
                        const result = JSON.parse(xhr.responseText);
                        if (xhr.status >= 200 && xhr.status < 300 && result.success) {
                            resolve(result);
                        } else {
                            resolve({
                                success: false,
                                error: result.error || `Erro HTTP ${xhr.status}`
                            });
                        }
                    } catch {
                        resolve({
                            success: false,
                            error: 'Resposta inválida do servidor'
                        });
                    }
                });

                // Error
                xhr.addEventListener('error', () => {
                    resolve({
                        success: false,
                        error: 'Erro de conexão. Verifique sua internet.'
                    });
                });

                // Timeout
                xhr.addEventListener('timeout', () => {
                    resolve({
                        success: false,
                        error: 'Upload expirou. Tente com um arquivo menor.'
                    });
                });

                xhr.open('POST', this.getEndpoint());
                xhr.timeout = 60000; // 60s timeout
                xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
                xhr.send(formData);
            });
        } catch (error: unknown) {
            console.error('Upload error:', error);
            return {
                success: false,
                error: (error as Error).message || 'Erro desconhecido no upload'
            };
        }
    }

    /**
     * Client-side validation (mirror of server rules)
     */
    private validateFile(file: File): { valid: boolean; error?: string } {
        const MAX_SIZE = 10 * 1024 * 1024; // 10MB
        const ALLOWED_TYPES = [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif',
            'application/pdf',
        ];

        if (file.size > MAX_SIZE) {
            return { valid: false, error: `Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máximo: 10MB.` };
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            return { valid: false, error: `Tipo não permitido: ${file.type}. Aceitos: JPG, PNG, WebP, GIF, PDF.` };
        }

        return { valid: true };
    }

    /**
     * Check if a URL points to a file (PDF or image)
     */
    getFileType(url: string): 'pdf' | 'image' | 'link' | null {
        if (!url) return null;
        const lower = url.toLowerCase();
        if (lower.endsWith('.pdf')) return 'pdf';
        if (/\.(jpg|jpeg|png|webp|gif)$/.test(lower)) return 'image';
        if (lower.startsWith('http')) return 'link';
        return null;
    }

    /**
     * Get a human-readable file size
     */
    formatFileSize(bytes: number): string {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
}

export const uploadService = new UploadService();
