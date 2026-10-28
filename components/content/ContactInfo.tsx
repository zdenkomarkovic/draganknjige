import { EMAIL, OWNER_NAME, PHONE_DISPLAY, PHONE_TEL } from '@/lib/contact'

export default function ContactInfo() {
  return (
    <div className="mt-8 rounded-xl bg-brand-soft p-6 space-y-2">
      <p className="font-semibold">{OWNER_NAME}</p>
      <p>
        Telefon / Viber / WhatsApp:{' '}
        <a href={`tel:${PHONE_TEL}`} className="font-semibold text-brand">
          {PHONE_DISPLAY}
        </a>
      </p>
      <p>
        Email:{' '}
        <a href={`mailto:${EMAIL}`} className="font-semibold text-brand">
          {EMAIL}
        </a>
      </p>
    </div>
  )
}
