import Link from 'next/link'
import Image from 'next/image'
import { SITE_NAME } from '@/lib/constants'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-gray-200 mt-auto bg-brand-soft/40">
      <div className="max-w-6xl mx-auto px-4 py-10 grid gap-8 md:grid-cols-3 text-sm text-gray-600">
        <div>
          <Image src="/logo.png" alt={SITE_NAME} width={160} height={160} className="h-28 w-auto mb-4" />
          <p>Naručite online, plaćanje pouzećem.</p>
        </div>

        <div>
          <h2 className="font-semibold text-gray-900 mb-3 font-serif">Kontakt</h2>
          <ul className="space-y-2">
            <li>
              <a href="tel:+381601428426" className="hover:text-brand">
                060 1428426
              </a>
            </li>
            <li>
              <a href="mailto:irex012@gmail.com" className="hover:text-brand">
                irex012@gmail.com
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-semibold text-gray-900 mb-3 font-serif">Korisni linkovi</h2>
          <ul className="space-y-2">
            <li><Link href="/kontakt/" className="hover:text-brand">Kontakt</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-200 py-4 text-xs text-gray-500 text-center">
        Copyright &copy; {year} | {SITE_NAME}
        <span className="mx-2">·</span>
        Izrada sajta:{' '}
        <a
          href="https://manikamwebsolutions.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline underline-offset-2"
        >
          Manikam Web Solutions
        </a>
      </div>
    </footer>
  )
}
