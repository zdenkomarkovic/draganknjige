import { requireAdmin, listUsers } from '@/lib/admin/auth'
import { getMainAdminId } from '@/lib/admin/users'
import { addUserAction, deleteUserAction, setUserPasswordAction, setUserRoleAction } from '../../actions'
import { ActionForm, btnGhostCls, ConfirmButton, Field, inputCls, PasswordInput } from '../../_components/ui'

export const metadata = { title: 'Korisnici' }

const ROLE_LABEL: Record<string, string> = { admin: 'Administrator', editor: 'Urednik' }

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ ok?: string; greska?: string }> }) {
  const me = await requireAdmin()
  const { ok, greska } = await searchParams
  const [users, mainId] = await Promise.all([listUsers(), getMainAdminId()])
  const iAmMain = me.id === mainId

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold font-serif mb-1">Korisnici</h1>
      <p className="text-sm text-gray-500 mb-5">
        Administrator može sve, uključujući dodavanje korisnika. Samo glavni administrator (najstariji nalog) može da briše druge
        administratore i da im menja lozinku, a niko ne može sam sebi da promeni ulogu. Urednik radi sa proizvodima, narudžbinama i
        porukama, ali ne vidi ovu stranicu.
      </p>
      {ok && <p className="mb-4 rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">Sačuvano.</p>}
      {greska && <p className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{greska}</p>}

      <div className="rounded-xl border border-gray-200 bg-white divide-y mb-8">
        {users.map((u) => (
          <div key={u.id} className="p-4 flex flex-wrap items-center gap-x-4 gap-y-3">
            <div className="min-w-0 flex-1 basis-56">
              <p className="font-medium truncate">
                {u.name} {u.id === me.id && <span className="text-xs text-gray-400">(ti)</span>}
                {u.id === mainId && (
                  <span className="ml-1 rounded bg-gray-800 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">
                    Glavni administrator
                  </span>
                )}
              </p>
              <p className="text-sm text-gray-500 truncate">{u.email}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {u.last_login_at ? `Poslednja prijava ${u.last_login_at.slice(0, 16)}` : 'Nikad prijavljen'}
              </p>
            </div>

            {u.id === me.id || u.id === mainId ? (
              <span className="text-sm text-gray-600">{ROLE_LABEL[u.role] ?? u.role}</span>
            ) : (
              <form action={setUserRoleAction} className="flex items-center gap-2">
                <input type="hidden" name="id" value={u.id} />
                <select name="role" defaultValue={u.role} className={`${inputCls} w-auto`} aria-label="Uloga">
                  {Object.entries(ROLE_LABEL).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
                <button className={btnGhostCls}>Promeni ulogu</button>
              </form>
            )}

            {(u.role !== 'admin' || iAmMain || u.id === me.id) && (
              <details className="text-sm">
                <summary className={`${btnGhostCls} cursor-pointer list-none`}>Nova lozinka</summary>
                <form action={setUserPasswordAction} className="mt-2 flex items-center gap-2">
                  <input type="hidden" name="id" value={u.id} />
                  <PasswordInput
                    name="password"
                    required
                    minLength={10}
                    autoComplete="new-password"
                    placeholder="Najmanje 10 znakova"
                    className={`${inputCls} w-48`}
                  />
                  <button className={btnGhostCls}>Sačuvaj</button>
                </form>
              </details>
            )}

            {u.id !== me.id && (u.role !== 'admin' || iAmMain) && (
              <form action={deleteUserAction}>
                <input type="hidden" name="id" value={u.id} />
                <ConfirmButton message={`Obrisati korisnika ${u.email}?`}>Obriši</ConfirmButton>
              </form>
            )}
          </div>
        ))}
      </div>

      <h2 className="text-lg font-semibold font-serif mb-3">Dodaj korisnika</h2>
      <ActionForm action={addUserAction} submitLabel="Dodaj korisnika" className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Ime i prezime">
            <input name="name" required minLength={2} className={inputCls} />
          </Field>
          <Field label="Email">
            <input name="email" type="email" required autoComplete="off" className={inputCls} />
          </Field>
          <Field label="Uloga">
            <select name="role" defaultValue="editor" className={inputCls}>
              <option value="editor">Urednik</option>
              <option value="admin">Administrator</option>
            </select>
          </Field>
          <Field label="Lozinka" hint="Najmanje 10 znakova.">
            <PasswordInput name="password" required minLength={10} autoComplete="new-password" className={inputCls} />
          </Field>
        </div>
      </ActionForm>
    </div>
  )
}
