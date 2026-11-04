// Prikaz sadržaja iz baze.
//  - RichText: HTML koji administrator unosi u dashboardu (tekst stranice kategorije, blog)
//  - PlainText: običan tekst (opis proizvoda); novi red = novi pasus

const html_styles = [
  '[&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:font-serif',
  '[&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:font-serif',
  '[&_h4]:text-lg [&_h4]:font-semibold [&_h4]:mt-6 [&_h4]:mb-2',
  '[&_p]:mb-4 [&_p]:leading-relaxed',
  '[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-1',
  '[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_ol]:space-y-1',
  '[&_blockquote]:border-l-4 [&_blockquote]:border-brand [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-600 [&_blockquote]:my-6',
  '[&_a]:text-brand [&_a]:underline [&_a]:underline-offset-2',
  '[&_img]:rounded-lg [&_img]:w-full [&_img]:h-auto [&_img]:my-6',
].join(' ')

export default function RichText({ html }: { html?: string | null }) {
  if (!html?.trim()) return null
  // Sadržaj unosi samo prijavljen administrator; zato se ne čisti dodatno
  return <div className={`text-gray-800 ${html_styles}`} dangerouslySetInnerHTML={{ __html: html }} />
}

export function PlainText({ text }: { text?: string | null }) {
  const paragraphs = (text ?? '')
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
  if (paragraphs.length === 0) return null
  return (
    <div className="text-gray-800">
      {paragraphs.map((p, i) => (
        <p key={i} className="mb-4 leading-relaxed">
          {p}
        </p>
      ))}
    </div>
  )
}
