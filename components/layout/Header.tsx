import Link from "next/link";
import Image from "next/image";
import CartIcon from "./CartIcon";
import { SITE_NAME } from "@/lib/constants";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <Image
            src="/logo.png"
            alt={SITE_NAME}
            width={120}
            height={120}
            priority
            className="h-20 w-auto object-contain"
          />
        </Link>

        <nav className="flex items-center gap-6 text-sm" aria-label="Glavni meni">
          <Link href="/kontakt/" className="hover:text-brand transition-colors">
            Kontakt
          </Link>
          <CartIcon />
        </nav>
      </div>
    </header>
  );
}
