import { requireUser } from '@/lib/admin/auth'
import { changePasswordAction } from '../../actions'
import { ActionForm, Field, inputCls } from '../../_components/ui'

export const metadata = { title: 'Moj nalog' }

export default async function AccountPage() {
  const user = await requireUser()
  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-semibold font-serif mb-1">Moj nalog</h1>
      <p className="text-sm text-gray-500 mb-5">{user.email}</p>
      <ActionForm action={changePasswordAction} submitLabel="Promeni lozinku" className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="space-y-4">
          <Field label="Trenutna lozinka">
            <input type="password" name="current" required autoComplete="current-password" className={inputCls} />
          </Field>
          <Field label="Nova lozinka" hint="Najmanje 10 znakova.">
            <input type="password" name="next" required minLength={10} autoComplete="new-password" className={inputCls} />
          </Field>
          <Field label="Ponovi novu lozinku">
            <input type="password" name="repeat" required minLength={10} autoComplete="new-password" className={inputCls} />
          </Field>
        </div>
      </ActionForm>
    </div>
  )
}
