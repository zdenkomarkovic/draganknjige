// Slike proizvoda se čuvaju na disku (UPLOADS_DIR) i služe preko /uploads/... (vidi app/uploads).
// Kad se slike presele na poseban domen/CDN, dovoljno je podesiti NEXT_PUBLIC_UPLOADS_URL.
const BASE = (process.env.NEXT_PUBLIC_UPLOADS_URL ?? '/uploads').replace(/\/$/, '')

export function imageUrl(path: string) {
  return `${BASE}/${path}`
}

/** Apsolutan URL (za OpenGraph, JSON-LD) */
export function absoluteImageUrl(path: string, siteUrl: string) {
  const url = imageUrl(path)
  return url.startsWith('http') ? url : `${siteUrl}${url}`
}
