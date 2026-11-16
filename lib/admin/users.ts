import 'server-only'
import { getPool, row } from '@/lib/db'
import { hashPassword } from './auth'

export type Role = 'admin' | 'editor'

export type UserResult = { ok: true } | { ok: false; error: string }

export async function addUser(input: { email: string; name: string; role: Role; password: string }): Promise<UserResult> {
  const email = input.email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'Unesi ispravnu email adresu.' }
  if (input.name.trim().length < 2) return { ok: false, error: 'Unesi ime.' }
  if (input.password.length < 10) return { ok: false, error: 'Lozinka mora imati najmanje 10 znakova.' }
  if (await row('SELECT id FROM users WHERE email = ?', [email])) return { ok: false, error: 'Korisnik sa ovim emailom već postoji.' }
  await getPool().query('INSERT INTO users (email, name, password_hash, role) VALUES (?, ?, ?, ?)', [
    email,
    input.name.trim().slice(0, 100),
    hashPassword(input.password),
    input.role,
  ])
  return { ok: true }
}

/** Glavni administrator je najstariji administratorski nalog (najmanji ID). */
export async function getMainAdminId(): Promise<number> {
  return (await row<{ id: number }>("SELECT MIN(id) AS id FROM users WHERE role = 'admin'"))?.id ?? 0
}

export async function setUserRole(userId: number, role: Role, actorId: number): Promise<UserResult> {
  if (userId === actorId) return { ok: false, error: 'Ne možeš sam sebi da promeniš ulogu.' }
  const u = await row<{ role: string }>('SELECT role FROM users WHERE id = ?', [userId])
  if (!u) return { ok: false, error: 'Korisnik ne postoji.' }
  if (userId === (await getMainAdminId())) return { ok: false, error: 'Ulogu glavnog administratora nije moguće menjati.' }
  await getPool().query('UPDATE users SET role = ? WHERE id = ?', [role, userId])
  return { ok: true }
}

/** Lozinku administratora (osim svoje, preko "Moj nalog") može da postavi samo glavni administrator. */
export async function setUserPassword(userId: number, password: string, actorId: number): Promise<UserResult> {
  if (password.length < 10) return { ok: false, error: 'Lozinka mora imati najmanje 10 znakova.' }
  const u = await row<{ role: string }>('SELECT role FROM users WHERE id = ?', [userId])
  if (!u) return { ok: false, error: 'Korisnik ne postoji.' }
  if (u.role === 'admin' && userId !== actorId && actorId !== (await getMainAdminId())) {
    return {
      ok: false,
      error: 'Lozinku drugog administratora može da postavi samo glavni administrator.',
    }
  }
  await getPool().query('UPDATE users SET password_hash = ?, failed_logins = 0, locked_until = NULL WHERE id = ?', [
    hashPassword(password),
    userId,
  ])
  await getPool().query('DELETE FROM sessions WHERE user_id = ?', [userId])
  return { ok: true }
}

export async function deleteUser(userId: number, actorId: number): Promise<UserResult> {
  if (userId === actorId) return { ok: false, error: 'Ne možeš obrisati sopstveni nalog.' }
  const u = await row<{ role: string }>('SELECT role FROM users WHERE id = ?', [userId])
  if (!u) return { ok: true }
  if (u.role === 'admin' && actorId !== (await getMainAdminId())) {
    return { ok: false, error: 'Administratore može da briše samo glavni administrator.' }
  }
  await getPool().query('DELETE FROM users WHERE id = ?', [userId]) // sesije se brišu preko FK
  return { ok: true }
}
