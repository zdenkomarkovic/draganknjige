import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/admin/auth'
import { getInquiry, INQUIRY_STATUSES, markInquirySeen } from '@/lib/admin/data'
import { deleteInquiryAction, setInquiryStatusAction } from '../../../actions'
import { btnCls, ConfirmButton, inputCls } from '../../../_components/ui'

export const metadata = { title: 'Upit' }

export default async function InquiryPage({
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
  const q = await getInquiry(Number(id))
  if (!q) notFound()
  await markInquirySeen(q.id)

  const tel = q.telefon.replace(/[^\d+]/g, '')
  return (
    <div className="max-w-3xl">
      <p className="text-sm mb-2">
        <Link href="/admin/upiti/" className="text-gray-500 hover:text-black">
          ← Poruke
        </Link>
      </p>
      <h1 className="text-2xl font-semibold font-serif mb-5">Upit #{q.id}</h1>
      {ok && <p className="mb-4 rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">Status je sačuvan.</p>}

      <form action={setInquiryStatusAction} className="flex gap-2 items-center mb-6">
        <input type="hidden" name="id" value={q.id} />
        <select name="status" defaultValue={q.status} className={`${inputCls} max-w-xs`}>
          {INQUIRY_STATUSES.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <button className={btnCls}>Promeni status</button>
      </form>

      <dl className="rounded-xl border border-gray-200 bg-white divide-y text-sm mb-6">
        <div className="flex px-4 py-2 gap-4">
          <dt className="w-32 shrink-0 text-gray-500">Proizvod</dt>
          <dd className="break-words">
            {q.product_slug ? (
              <Link href={`/shop/${q.product_slug}/`} target="_blank" className="text-brand hover:underline">
                {q.product_name} ↗
              </Link>
            ) : (
              q.product_name
            )}
            {q.product_id && (
              <>
                {' '}
                <Link href={`/admin/proizvodi/${q.product_id}/`} className="text-gray-500 hover:text-black">
                  (izmeni)
                </Link>
              </>
            )}
          </dd>
        </div>
        <div className="flex px-4 py-2 gap-4">
          <dt className="w-32 shrink-0 text-gray-500">Ime</dt>
          <dd>{q.ime}</dd>
        </div>
        <div className="flex px-4 py-2 gap-4">
          <dt className="w-32 shrink-0 text-gray-500">Telefon</dt>
          <dd>
            <a href={`tel:${tel}`} className="font-semibold text-brand hover:underline">
              {q.telefon}
            </a>
          </dd>
        </div>
        <div className="flex px-4 py-2 gap-4">
          <dt className="w-32 shrink-0 text-gray-500">Email</dt>
          <dd className="break-words">
            {q.email ? (
              <a href={`mailto:${q.email}`} className="hover:text-brand">
                {q.email}
              </a>
            ) : (
              '—'
            )}
          </dd>
        </div>
        <div className="flex px-4 py-2 gap-4">
          <dt className="w-32 shrink-0 text-gray-500">Datum</dt>
          <dd>{q.created_at}</dd>
        </div>
        <div className="flex px-4 py-2 gap-4">
          <dt className="w-32 shrink-0 text-gray-500">Poruka</dt>
          <dd className="whitespace-pre-wrap break-words">{q.poruka}</dd>
        </div>
      </dl>

      <form action={deleteInquiryAction}>
        <input type="hidden" name="id" value={q.id} />
        <ConfirmButton message="Obrisati ovaj upit?">Obriši upit</ConfirmButton>
      </form>
    </div>
  )
}
