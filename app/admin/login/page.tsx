import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/admin/auth'
import { loginAction } from '../actions'
import { ActionForm, Field, inputCls, PasswordInput } from '../_components/ui'

export const dynamic = 'force-dynamic'

export default async function LoginPage() {
  if (await getCurrentUser()) redirect('/admin/')
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl bg-white border border-gray-200 shadow-sm p-6">
        <h1 className="text-xl font-semibold font-serif mb-1">Dragan knjige</h1>
        <p className="text-sm text-gray-500 mb-5">Prijava u dashboard</p>
        <ActionForm action={loginAction} submitLabel="Prijavi se">
          <div className="space-y-4">
            <Field label="Email">
              <input name="email" type="email" required autoComplete="username" autoFocus className={inputCls} />
            </Field>
            <Field label="Lozinka">
              <PasswordInput name="password" required autoComplete="current-password" className={inputCls} />
            </Field>
          </div>
        </ActionForm>
      </div>
    </main>
  )
}
