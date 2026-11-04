import Link from 'next/link'
import { requireUser } from '@/lib/admin/auth'
import { getStats } from '@/lib/admin/data'

export const metadata = { title: 'Pregled' }

const STATUS_LABEL: Record<string, string> = {
  link: 'Samo lista (čeka detalje)',
  details: 'Detalji skinuti (čekaju slike)',
  images: 'Slike u toku',
  done: 'Kompletno',
}

function Card({ title, value, sub, href }: { title: string; value: string | number; sub?: string; href?: string }) {
  const body = (
    <div className="rounded-xl border border-gray-200 bg-white p-5 h-full">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-3xl font-semibold mt-1">{Number(value).toLocaleString('sr-RS')}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
  return href ? <Link href={href}>{body}</Link> : body
}

export default async function OverviewPage() {
  await requireUser()
  const { products, orders, imports } = await getStats()
  const total = Number(products?.total ?? 0)
  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-semibold font-serif mb-6">Pregled</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Proizvodi" value={total} sub={`${Number(products?.visible ?? 0).toLocaleString('sr-RS')} vidljivo`} href="/admin/proizvodi/" />
        <Card title="Sakriveni" value={products?.hidden ?? 0} href="/admin/proizvodi/?visible=0" />
        <Card title="Bez slike" value={products?.no_image ?? 0} />
        <Card title="Nove narudžbine" value={orders?.nove ?? 0} sub={`ukupno ${orders?.ukupno ?? 0}`} href="/admin/narudzbine/?status=nova" />
      </div>

      <h2 className="text-lg font-semibold font-serif mt-10 mb-3">Stanje uvoza sa KupujemProdajem</h2>
      <div className="rounded-xl border border-gray-200 bg-white divide-y">
        {Object.entries(STATUS_LABEL).map(([k, label]) => {
          const n = Number(imports[k] ?? 0)
          return (
            <Link key={k} href={`/admin/proizvodi/?status=${k}`} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50">
              <span className="flex-1 text-sm">{label}</span>
              <span className="w-32 hidden sm:block h-2 rounded bg-gray-100 overflow-hidden">
                <span className="block h-full bg-brand" style={{ width: `${total ? (n / total) * 100 : 0}%` }} />
              </span>
              <span className="w-16 text-right text-sm font-medium">{n.toLocaleString('sr-RS')}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
