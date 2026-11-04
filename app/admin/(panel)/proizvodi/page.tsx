import Link from 'next/link'
import { requireUser } from '@/lib/admin/auth'
import { ADMIN_PAGE_SIZE, listCategoriesAdmin, listProducts } from '@/lib/admin/data'
import { imageUrl } from '@/lib/images'
import { toggleVisibleAction } from '../../actions'
import { btnCls, btnGhostCls, inputCls } from '../../_components/ui'

export const metadata = { title: 'Proizvodi' }

type SP = { q?: string; cat?: string; visible?: string; status?: string; page?: string; obrisano?: string }

function qs(sp: SP, over: Record<string, string | undefined>) {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries({ ...sp, ...over })) if (v && k !== 'obrisano') p.set(k, v)
  const s = p.toString()
  return s ? `?${s}` : ''
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireUser()
  const sp = await searchParams
  const catParam = sp.cat ?? ''
  const [type, rawId] = catParam.split(':')
  const filterId = Number(rawId) || undefined
  const [{ list, total, page }, cats] = await Promise.all([
    listProducts({
      q: sp.q,
      categoryId: type === 'c' ? filterId : undefined,
      subcategoryId: type === 's' ? filterId : undefined,
      visible: sp.visible === '0' || sp.visible === '1' ? sp.visible : undefined,
      status: sp.status,
      page: Number(sp.page) || 1,
    }),
    listCategoriesAdmin(),
  ])
  const pages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE))

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h1 className="text-2xl font-semibold font-serif">
          Proizvodi <span className="text-base text-gray-500 font-sans">({total.toLocaleString('sr-RS')})</span>
        </h1>
        <Link href="/admin/proizvodi/novi/" className={btnCls}>
          + Novi proizvod
        </Link>
      </div>
      {sp.obrisano && <p className="mb-4 rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">Proizvod je obrisan.</p>}

      <form className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4" method="get">
        <input name="q" defaultValue={sp.q} placeholder="Naziv ili ID…" className={`${inputCls} col-span-2`} />
        <select name="cat" defaultValue={catParam} className={inputCls}>
          <option value="">Sve kategorije</option>
          {cats.map((c) => (
            <optgroup key={c.id} label={c.name}>
              <option value={`c:${c.id}`}>Cela kategorija: {c.name}</option>
              {c.subs.map((s) => (
                <option key={s.id} value={`s:${s.id}`}>
                  {s.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <select name="visible" defaultValue={sp.visible ?? ''} className={inputCls}>
          <option value="">Vidljivost: sve</option>
          <option value="1">Vidljivi</option>
          <option value="0">Sakriveni</option>
        </select>
        <select name="status" defaultValue={sp.status ?? ''} className={inputCls}>
          <option value="">Uvoz: sve</option>
          <option value="link">Samo lista</option>
          <option value="details">Čeka slike</option>
          <option value="done">Kompletno</option>
        </select>
        <button className={`${btnCls} col-span-2 md:col-span-1`}>Filtriraj</button>
      </form>

      <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-3 py-2 w-14"></th>
              <th className="px-3 py-2">Naziv</th>
              <th className="px-3 py-2">Kategorija</th>
              <th className="px-3 py-2 text-right">Cena</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {list.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-gray-500">
                  Nema proizvoda za ove filtere.
                </td>
              </tr>
            )}
            {list.map((p) => (
              <tr key={p.id} className={p.visible ? '' : 'bg-gray-50 text-gray-500'}>
                <td className="px-3 py-2">
                  {p.thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageUrl(p.thumb)} alt="" className="h-12 w-10 object-contain rounded bg-gray-50" loading="lazy" />
                  ) : (
                    <span className="block h-12 w-10 rounded bg-gray-100" />
                  )}
                </td>
                <td className="px-3 py-2 max-w-md">
                  <Link href={`/admin/proizvodi/${p.id}/`} className="font-medium hover:text-brand">
                    {p.name}
                  </Link>
                  <span className="block text-xs text-gray-400">#{p.id}</span>
                </td>
                <td className="px-3 py-2 text-xs">
                  {p.cat}
                  {p.sub && <span className="block text-gray-400">{p.sub}</span>}
                </td>
                <td className="px-3 py-2 text-right whitespace-nowrap">
                  {p.price != null ? `${p.price.toLocaleString('sr-RS')} RSD` : '—'}
                </td>
                <td className="px-3 py-2 text-xs whitespace-nowrap">
                  {p.visible ? 'Vidljiv' : 'Sakriven'}
                  {p.import_status !== 'done' && <span className="block text-amber-600">uvoz: {p.import_status}</span>}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-right">
                  <form action={toggleVisibleAction} className="inline">
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="visible" value={p.visible ? '0' : '1'} />
                    <button className={btnGhostCls}>{p.visible ? 'Sakrij' : 'Prikaži'}</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-gray-500">
            Strana {page} od {pages.toLocaleString('sr-RS')}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link className={btnGhostCls} href={`/admin/proizvodi/${qs(sp, { page: String(page - 1) })}`}>
                ← Prethodna
              </Link>
            )}
            {page < pages && (
              <Link className={btnGhostCls} href={`/admin/proizvodi/${qs(sp, { page: String(page + 1) })}`}>
                Sledeća →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
