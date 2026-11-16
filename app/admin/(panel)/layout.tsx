import Link from 'next/link'
import { requireUser } from '@/lib/admin/auth'
import { getNewCounts } from '@/lib/admin/data'
import { logoutAction } from '../actions'
import SidebarNav from '../_components/SidebarNav'

export const dynamic = 'force-dynamic'

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()
  const counts = await getNewCounts().catch(() => ({ orders: 0, inquiries: 0 }))
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="md:w-56 shrink-0 bg-white border-b md:border-b-0 md:border-r border-gray-200 p-4">
        <p className="font-serif font-semibold text-lg">Dragan knjige</p>
        <p className="text-xs text-gray-500 mb-4 truncate">{user.name}</p>
        <nav className="flex md:flex-col gap-1 flex-wrap">
          <SidebarNav initial={counts} isAdmin={user.role === 'admin'} />
          <Link href="/" target="_blank" className="rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-100">
            Pogledaj sajt ↗
          </Link>
        </nav>
        <form action={logoutAction} className="mt-4">
          <button className="text-sm text-gray-500 hover:text-black px-3">Odjava</button>
        </form>
      </aside>
      <main className="flex-1 min-w-0 p-4 md:p-8">{children}</main>
    </div>
  )
}
