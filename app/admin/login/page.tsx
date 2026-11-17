import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/admin/auth'
import { Field, inputCls, PasswordInput } from '../_components/ui'

export const dynamic = 'force-dynamic'

const ERRORS: Record<string, string> = {
  bad: 'Pogrešan email ili lozinka.',
  locked: 'Previše pokušaja. Pokušaj ponovo za 15 minuta.',
  server: 'Došlo je do greške na serveru. Pokušaj ponovo.',
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  if (await getCurrentUser()) redirect('/admin/')
  const { e } = await searchParams
  const error = e ? ERRORS[e] : undefined
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl bg-white border border-gray-200 shadow-sm p-6">
        <h1 className="text-xl font-semibold font-serif mb-1">Dragan knjige</h1>
        <p className="text-sm text-gray-500 mb-5">Prijava u dashboard</p>
        {/* Obična HTML forma: POST na route handler koji postavlja kolačić i preusmerava */}
        <form method="post" action="/api/admin/login/">
          <div className="space-y-4">
            <Field label="Email">
              <input name="email" type="email" required autoComplete="username" autoFocus className={inputCls} />
            </Field>
            <Field label="Lozinka">
              <PasswordInput name="password" required autoComplete="current-password" className={inputCls} />
            </Field>
          </div>
          {error && (
            <p role="alert" className="mt-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <div className="mt-5">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark transition-colors"
            >
              Prijavi se
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
