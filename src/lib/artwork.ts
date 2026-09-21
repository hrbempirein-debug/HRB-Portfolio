/**
 * Source artwork registry — the untouched PNGs are the single source of truth
 * for every body visual. These are served from public/, never transformed.
 */
export const artwork = {
  'web': '/source-art/web.png.png',
  'ai': '/source-art/ai.png.png',
  'systems': '/source-art/System.png.png',
  'project-legal-ai': '/source-art/hrb-legal-ai.png.png',
  'project-legal-reader': '/source-art/hrb-legal-reader.png.png',
  'project-digital-systems': '/source-art/hrb-digital-systems.png.png',
  'about': '/source-art/about.png.png',
} as const

export type ArtworkKey = keyof typeof artwork