// Pravi (ili menja lozinku) administratoru.
//   node --env-file=.env.local scripts/create-admin.mjs email "Ime Prezime" "lozinka (min 10 znakova)"
import crypto from 'node:crypto'
import mysql from 'mysql2/promise'

const [email, name, password] = process.argv.slice(2)
if (!email || !name || !password || password.length < 10) {
  console.log('Upotreba: node --env-file=.env.local scripts/create-admin.mjs email "Ime Prezime" "lozinka (min 10 znakova)"')
  process.exit(1)
}
const salt = crypto.randomBytes(16)
const hash = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 })
const stored = `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`

const db = await mysql.createConnection({ uri: process.env.DATABASE_URL, charset: 'utf8mb4' })
await db.query(
  `INSERT INTO users (email, name, password_hash, role) VALUES (?, ?, ?, 'admin')
   ON DUPLICATE KEY UPDATE name = VALUES(name), password_hash = VALUES(password_hash), failed_logins = 0, locked_until = NULL`,
  [email.trim().toLowerCase(), name, stored],
)
await db.end()
console.log(`Nalog ${email.trim().toLowerCase()} je spreman.`)
