import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/admin/auth'
import { getOrder, markOrderSeen, ORDER_STATUSES } from '@/lib/admin/data'
import { setOrderStatusAction } from '../../../actions'
import { btnCls, inputCls } from '../../../_components/ui'

export const metadata = { title: 'Narudžbina' }

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ ok?: string }>
}) {
  await requireUser()
  const { id } = await params
  const { ok } = await searchParams
  if (!Number.isInteger(Number(id))) notFound()
  const data = await getOrder(Number(id))
  if (!data) notFound()
  const { order: o, items } = data
  await markOrderSeen(Number(id))
  const rows: [string, unknown][] = [
    ['Ime i prezime', `${o.ime} ${o.prezime}`],
    ['Email', o.email],
    ['Telefon', o.telefon],
    ['Adresa', `${o.adresa}, ${o.postanski_broj} ${o.grad}`],
    ['Napomena', o.napomena || '—'],
    ['Marketing saglasnost', o.marketing_consent ? 'da' : 'ne'],
    ['Datum', String(o.created_at)],
  ]
  return (
    <div className="max-w-3xl">
      <p className="text-sm mb-2">
        <Link href="/admin/narudzbine/" className="text-gray-500 hover:text-black">
          ← Narudžbine
        </Link>
      </p>
      <h1 className="text-2xl font-semibold font-serif mb-5">Narudžbina #{String(o.id)}</h1>
      {ok && <p className="mb-4 rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">Status je sačuvan.</p>}

      <form action={setOrderStatusAction} className="flex gap-2 items-center mb-6">
        <input type="hidden" name="id" value={String(o.id)} />
        <select name="status" defaultValue={String(o.status)} className={`${inputCls} max-w-xs`}>
          {ORDER_STATUSES.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <button className={btnCls}>Promeni status</button>
      </form>

      <dl className="rounded-xl border border-gray-200 bg-white divide-y text-sm mb-6">
        {rows.map(([k, v]) => (
          <div key={k} className="flex px-4 py-2 gap-4">
            <dt className="w-44 shrink-0 text-gray-500">{k}</dt>
            <dd className="whitespace-pre-wrap break-words">{String(v)}</dd>
          </div>
        ))}
      </dl>

      <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-3 py-2">Proizvod</th>
              <th className="px-3 py-2 text-right">Kom</th>
              <th className="px-3 py-2 text-right">Cena</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((i, n) => (
              <tr key={n}>
                <td className="px-3 py-2">
                  {i.product_id ? (
                    <Link href={`/admin/proizvodi/${i.product_id}/`} className="hover:text-brand">
                      {i.name}
                    </Link>
                  ) : (
                    i.name
                  )}
                </td>
                <td className="px-3 py-2 text-right">{i.quantity}</td>
                <td className="px-3 py-2 text-right whitespace-nowrap">{(i.price * i.quantity).toLocaleString('sr-RS')} RSD</td>
              </tr>
            ))}
            <tr className="font-semibold">
              <td className="px-3 py-2" colSpan={2}>
                Ukupno
              </td>
              <td className="px-3 py-2 text-right whitespace-nowrap">{Number(o.total).toLocaleString('sr-RS')} RSD</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
