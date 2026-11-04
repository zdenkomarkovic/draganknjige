import 'server-only'
import crypto from 'node:crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { row, rows, getPool } from '@/lib/db'

export const SESSION_COOKIE = 'dk_session'
const SESSION_DAYS = 14
const MAX_FAILED = 5
const LOCK_MINUTES = 15

export interface AdminUser {
  id: number
  email: string
  name: string
  role: 'admin' | 'editor'
}

// ─── Lozinke (scrypt) ────────────────────────────────────────────────────────

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16)
  const hash = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 })
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, saltB64, hashB64] = stored.split('$')
  if (scheme !== 'scrypt' || !saltB64 || !hashB64) return false
  const expected = Buffer.from(hashB64, 'base64')
  const actual = crypto.scryptSync(password, Buffer.from(saltB64, 'base64'), expected.length, { N: 16384, r: 8, p: 1 })
  return crypto.timingSafeEqual(actual, expected)
}

// Lažni heš: provera traje isto i kad korisnik ne postoji (ne otkriva koji emailovi su nalozi)
const DUMMY_HASH = hashPassword(crypto.randomBytes(8).toString('hex'))

// ─── Prijava / sesija ────────────────────────────────────────────────────────

const tokenId = (token: string) => crypto.createHash('sha256').update(token).digest('hex')

export type LoginResult = { ok: true } | { ok: false; error: string }

export async function login(email: string, password: string): Promise<LoginResult> {
  const generic = 'Pogrešan email ili lozinka.'
  email = email.trim().toLowerCase()
  if (!email || !password) return { ok: false, error: generic }

  const user = await row<{ id: number; password_hash: string; locked: number }>(
    'SELECT id, password_hash, (locked_until IS NOT NULL AND locked_until > NOW()) AS locked FROM users WHERE email = ?',
    [email],
  )

  if (user?.locked) return { ok: false, error: `Previše pokušaja. Pokušaj ponovo za ${LOCK_MINUTES} minuta.` }

  const valid = verifyPassword(password, user?.password_hash ?? DUMMY_HASH) && !!user
  if (!user || !valid) {
    if (user) {
      await getPool().query(
        `UPDATE users SET failed_logins = failed_logins + 1,
           locked_until = IF(failed_logins + 1 >= ?, DATE_ADD(NOW(), INTERVAL ? MINUTE), locked_until) WHERE id = ?`,
        [MAX_FAILED, LOCK_MINUTES, user.id],
      )
    }
    return { ok: false, error: generic }
  }

  await getPool().query('UPDATE users SET failed_logins = 0, locked_until = NULL, last_login_at = NOW() WHERE id = ?', [user.id])

  const token = crypto.randomBytes(32).toString('hex')
  await getPool().query('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? DAY))', [
    tokenId(token),
    user.id,
    SESSION_DAYS,
  ])
  // Povremeno čistimo istekle sesije
  if (Math.random() < 0.1) await getPool().query('DELETE FROM sessions WHERE expires_at < NOW()')

  const jar = await cookies()
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 3600,
  })
  return { ok: true }
}

export async function logout() {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  if (token) await getPool().query('DELETE FROM sessions WHERE id = ?', [tokenId(token)])
  jar.delete(SESSION_COOKIE)
}

export async function getCurrentUser(): Promise<AdminUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!token || !/^[0-9a-f]{64}$/.test(token)) return null
  return row<AdminUser>(
    `SELECT u.id, u.email, u.name, u.role FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.id = ? AND s.expires_at > NOW()`,
    [tokenId(token)],
  )
}

/** Poziva se na početku SVAKE stranice i akcije u dashboardu. */
export async function requireUser(): Promise<AdminUser> {
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login/')
  return user
}

export async function changePassword(userId: number, current: string, next: string): Promise<LoginResult> {
  if (next.length < 10) return { ok: false, error: 'Nova lozinka mora imati najmanje 10 znakova.' }
  const u = await row<{ password_hash: string }>('SELECT password_hash FROM users WHERE id = ?', [userId])
  if (!u || !verifyPassword(current, u.password_hash)) return { ok: false, error: 'Trenutna lozinka nije tačna.' }
  await getPool().query('UPDATE users SET password_hash = ? WHERE id = ?', [hashPassword(next), userId])
  // Ostale sesije se odjavljuju
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  await getPool().query('DELETE FROM sessions WHERE user_id = ? AND id <> ?', [userId, token ? tokenId(token) : ''])
  return { ok: true }
}

export async function listUsers() {
  return rows<{ id: number; email: string; name: string; role: string; last_login_at: string | null }>(
    'SELECT id, email, name, role, last_login_at FROM users ORDER BY id',
  )
}
