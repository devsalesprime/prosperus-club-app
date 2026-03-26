export function getOptimizedImageUrl(
  url: string | null | undefined,
  width: number = 200,
  quality: number = 80
): string {
  if (!url) return '';
  if (!url.includes('supabase.co/storage')) return url;

  // Supabase Storage transformation API
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}width=${width}&quality=${quality}&format=webp`;
}
