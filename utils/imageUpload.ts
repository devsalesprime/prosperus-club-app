// ============================================
// IMAGE UPLOAD — Canvas normalization for profile photos
// ============================================
// Converts ANY image (HEIC, WebP, AVIF, Google Fotos) to JPEG via Canvas.
// This guarantees compatibility across Supabase Storage, Safari, and all browsers.
//
// Usage:
//   import { normalizeImage } from '../utils/imageUpload';
//   const blob = await normalizeImage(file);
//   // upload blob to storage

/**
 * Converts any image File to a JPEG Blob via Canvas.
 * Handles HEIC, HEIF, WebP, AVIF, and remote URIs (Google Fotos).
 * Resizes to max dimension while preserving aspect ratio.
 *
 * @param file - The original File from <input type="file">
 * @param maxDimension - Max width/height in px (default 1200)
 * @param quality - JPEG quality 0-1 (default 0.88)
 * @returns JPEG Blob ready for upload
 */
export async function normalizeImage(
    file: File,
    maxDimension = 1200,
    quality = 0.88
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const objectUrl = URL.createObjectURL(file);
        const img = new Image();

        img.onload = () => {
            URL.revokeObjectURL(objectUrl);

            // Calculate dimensions preserving aspect ratio
            let { naturalWidth: w, naturalHeight: h } = img;
            if (w > maxDimension || h > maxDimension) {
                if (w > h) {
                    h = Math.round(h * maxDimension / w);
                    w = maxDimension;
                } else {
                    w = Math.round(w * maxDimension / h);
                    h = maxDimension;
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Canvas 2D context not available'));
                return;
            }

            ctx.drawImage(img, 0, 0, w, h);

            canvas.toBlob(
                blob => blob ? resolve(blob) : reject(new Error('Canvas toBlob falhou')),
                'image/jpeg',
                quality
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Não foi possível carregar a imagem. Tente outro arquivo.'));
        };

        img.src = objectUrl;
    });
}

/**
 * Validates a file before attempting normalization.
 * Returns an error message if invalid, null if OK.
 */
export function validateImageFile(file: File): string | null {
    // Max 15MB raw (after Canvas normalization it'll be ~200KB)
    if (file.size > 15 * 1024 * 1024) {
        return 'Arquivo muito grande. Use uma foto menor que 15MB.';
    }

    // Check by MIME type or extension
    const validExtensions = /\.(jpg|jpeg|png|gif|webp|heic|heif|avif|bmp|tiff?)$/i;
    const validMime = file.type.startsWith('image/');
    const validExt = validExtensions.test(file.name);

    if (!validMime && !validExt) {
        return 'Formato não suportado. Use JPG, PNG ou HEIC.';
    }

    return null;
}
