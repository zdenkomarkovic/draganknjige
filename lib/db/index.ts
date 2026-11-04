import mysql from 'mysql2/promise'

// Jedan pool po procesu (u dev režimu se čuva na globalThis da hot reload ne otvara nove konekcije)
const g = globalThis as unknown as { __dbPool?: mysql.Pool }

function createPool() {
  const uri = process.env.DATABASE_URL
  if (!uri) throw new Error('DATABASE_URL nije podešen')
  return mysql.createPool({
    uri,
    charset: 'utf8mb4',
    connectionLimit: Number(process.env.DB_POOL_SIZE ?? 8),
    // Datum/vreme iz baze se čita kao običan tekst da ne zavisi od vremenske zone servera
    dateStrings: true,
    decimalNumbers: true,
  })
}

export function getPool() {
  return (g.__dbPool ??= createPool())
}

/** SELECT: vraća niz redova. Parametri idu kroz `?` (nikad konkatenacijom). */
export async function rows<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
  const [result] = await getPool().query(sql, params)
  return result as T[]
}

export async function row<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T | null> {
  return (await rows<T>(sql, params))[0] ?? null
}
