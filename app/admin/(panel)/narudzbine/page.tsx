import Link from 'next/link'
import { requireUser } from '@/lib/admin/auth'
import { ADMIN_PAGE_SIZE, listOrders, ORDER_STATUSES } from '@/lib/admin/data'
import { btnGhostCls } from '../../_components/ui'
import { statusStyle } from '../../_components/statusColors'

export const metadata = { title: 'Narudžbine' }

const activeCls = (k: string) =>
  `inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-sm font-semibold shadow-sm ${statusStyle(k).active}`
const label = Object.fromEntries(ORDER_STATUSES)

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
  await requireUser()
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page) || 1)
  const { list, total } = await listOrders(sp.status, page)
  const pages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE))
  const base = sp.status ? `status=${sp.status}&` : ''
  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h1 className="text-2xl font-semibold font-serif">Narudžbine ({total})</h1>
      </div>
      <div className="flex gap-2 mb-4 flex-wrap text-sm">
        <Link href="/admin/narudzbine/" className={!sp.status ? activeCls('all') : btnGhostCls}>
          Sve
        </Link>
        {ORDER_STATUSES.map(([v, l]) => (
          <Link key={v} href={`/admin/narudzbine/?status=${v}`} className={sp.status === v ? activeCls(v) : btnGhostCls}>
            {sp.status !== v && <span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${statusStyle(v).dot}`} />}
            {l}
          </Link>
        ))}
      </div>
      <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Datum</th>
              <th className="px-3 py-2">Kupac</th>
              <th className="px-3 py-2">Grad</th>
              <th className="px-3 py-2 text-right">Stavki</th>
              <th className="px-3 py-2 text-right">Ukupno</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {list.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-gray-500">
                  Nema narudžbina.
                </td>
              </tr>
            )}
            {list.map((o) => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="px-3 py-2">
                  <Link href={`/admin/narudzbine/${o.id}/`} className="font-medium text-brand">
                    #{o.id}
                  </Link>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">{o.created_at.slice(0, 16)}</td>
                <td className="px-3 py-2">
                  {o.ime} {o.prezime}
                </td>
                <td className="px-3 py-2">{o.grad}</td>
                <td className="px-3 py-2 text-right">{o.items}</td>
                <td className="px-3 py-2 text-right whitespace-nowrap">{o.total.toLocaleString('sr-RS')} RSD</td>
                <td className="px-3 py-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle(o.status).badge}`}>
                    {label[o.status] ?? o.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-right">
                  <Link href={`/admin/narudzbine/${o.id}/`} className={`${btnGhostCls} whitespace-nowrap`}>
                    Pogledaj →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="flex justify-between mt-4 text-sm">
          <span className="text-gray-500">
            Strana {page} od {pages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link className={btnGhostCls} href={`/admin/narudzbine/?${base}page=${page - 1}`}>
                ← Prethodna
              </Link>
            )}
            {page < pages && (
              <Link className={btnGhostCls} href={`/admin/narudzbine/?${base}page=${page + 1}`}>
                Sledeća →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
