export function getOptimizedImageUrl(
  url: string | null | undefined,
  _width: number = 200,
  _quality: number = 80
): string {
  if (!url) return '';
  // Nota: Supabase Image Transformation (width/quality/format=webp) requer plano pago.
  // Retornamos a URL original para evitar erros 400 Bad Request.
  return url;
}
