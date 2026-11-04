import Link from 'next/link'
import { requireUser } from '@/lib/admin/auth'
import { listCategoriesAdmin } from '@/lib/admin/data'
import { deleteCategoryAction } from '../../actions'
import { btnCls, btnGhostCls, ConfirmButton } from '../../_components/ui'

export const metadata = { title: 'Kategorije' }

export default async function CategoriesPage({ searchParams }: { searchParams: Promise<{ ok?: string; greska?: string }> }) {
  await requireUser()
  const sp = await searchParams
  const cats = await listCategoriesAdmin()
  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h1 className="text-2xl font-semibold font-serif">Kategorije</h1>
        <div className="flex gap-2">
          <Link href="/admin/kategorije/pod/novi/" className={btnGhostCls}>
            + Podkategorija
          </Link>
          <Link href="/admin/kategorije/novi/" className={btnCls}>
            + Kategorija
          </Link>
        </div>
      </div>
      {sp.ok && <p className="mb-4 rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">Sačuvano.</p>}
      {sp.greska && (
        <p className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          Ne može da se obriše: ima proizvoda ili podkategorija. Prvo ih premesti.
        </p>
      )}
      <div className="space-y-4">
        {cats.map((c) => (
          <div key={c.id} className="rounded-xl border border-gray-200 bg-white">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 flex-wrap">
              <Link href={`/admin/kategorije/${c.id}/`} className="font-semibold hover:text-brand">
                {c.name}
              </Link>
              {!c.visible && <span className="text-xs rounded bg-gray-100 px-2 py-0.5">sakrivena</span>}
              <span className="text-xs text-gray-500">{c.products.toLocaleString('sr-RS')} proizvoda</span>
              <form action={deleteCategoryAction} className="ml-auto">
                <input type="hidden" name="id" value={c.id} />
                <ConfirmButton message={`Obrisati kategoriju "${c.name}"?`}>Obriši</ConfirmButton>
              </form>
            </div>
            <ul className="divide-y divide-gray-50">
              {c.subs.map((s) => (
                <li key={s.id} className="flex items-center gap-3 px-4 py-2 text-sm flex-wrap">
                  <Link href={`/admin/kategorije/pod/${s.id}/`} className="hover:text-brand">
                    {s.name}
                  </Link>
                  {!s.visible && <span className="text-xs rounded bg-gray-100 px-2 py-0.5">sakrivena</span>}
                  <span className="text-xs text-gray-500">{s.products.toLocaleString('sr-RS')}</span>
                  <form action={deleteCategoryAction} className="ml-auto">
                    <input type="hidden" name="kind" value="sub" />
                    <input type="hidden" name="id" value={s.id} />
                    <ConfirmButton message={`Obrisati podkategoriju "${s.name}"?`}>Obriši</ConfirmButton>
                  </form>
                </li>
              ))}
              {c.subs.length === 0 && <li className="px-4 py-2 text-sm text-gray-400">Nema podkategorija.</li>}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
