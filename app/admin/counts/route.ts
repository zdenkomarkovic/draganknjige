import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/admin/auth'
import { getNewCounts } from '@/lib/admin/data'

export const dynamic = 'force-dynamic'

// Brojači novih (neotvorenih) narudžbina i poruka za sidebar u adminu
export async function GET() {
  await requireUser()
  return NextResponse.json(await getNewCounts(), { headers: { 'Cache-Control': 'no-store' } })
}
