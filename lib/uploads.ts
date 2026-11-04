import path from 'node:path'

/** Folder sa slikama proizvoda (isti koji koristi uvoz i ruta /uploads). */
export const UPLOADS_DIR = path.resolve(process.env.UPLOADS_DIR ?? path.join(process.cwd(), 'uploads'))
