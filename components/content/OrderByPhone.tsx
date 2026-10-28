import { CHANNELS, PHONE_DISPLAY } from '@/lib/contact'

// Blok "Poručite telefonom" na stranici proizvoda: Viber, WhatsApp, poziv i Instagram DM
const ORDER_CHANNELS = [CHANNELS.viber, CHANNELS.whatsapp, CHANNELS.sms, CHANNELS.call]

export default function OrderByPhone() {
  return (
    <div className="rounded-2xl border border-brand/25 bg-white p-4 md:p-5">
      <p className="font-semibold font-serif text-gray-900">Poručite telefonom</p>
      <p className="text-sm text-gray-500 mt-0.5">
        Poziv, Viber, WhatsApp ili SMS:{' '}
        <a href={CHANNELS.call.href} className="font-semibold text-gray-800 hover:text-brand">
          {PHONE_DISPLAY}
        </a>
      </p>
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {ORDER_CHANNELS.map((c) => (
          <a
            key={c.label}
            href={c.href}
            {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            aria-label={c.aria}
            className="group flex flex-col items-center gap-1.5 rounded-xl border border-gray-200 px-2 py-3 text-xs font-semibold text-gray-700 hover:border-transparent hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full text-white"
              style={{ backgroundColor: c.color }}
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d={c.icon} />
              </svg>
            </span>
            {c.label}
          </a>
        ))}
      </div>
    </div>
  )
}
