import Mailjet from 'node-mailjet'
import type { CartItem, OrderFormData } from '@/types/shop'

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? 'Prodavnica'

function formatPrice(n: number) {
  return n.toLocaleString('sr-RS') + ' RSD'
}

function buildTotalsRows(subtotal: number) {
  return `
      <tr>
        <td colspan="2" style="padding:8px;text-align:right;color:#666">Iznos porudžbine:</td>
        <td style="padding:8px;text-align:right">${formatPrice(subtotal)}</td>
      </tr>
      <tr>
        <td colspan="2" style="padding:12px 8px;text-align:right;font-weight:bold">Ukupno:</td>
        <td style="padding:12px 8px;text-align:right;font-weight:bold;font-size:18px">${formatPrice(subtotal)}</td>
      </tr>`
}

function buildOwnerHtml(form: OrderFormData, items: CartItem[], total: number) {
  const rows = items
    .map(
      (item) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee">${item.name}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${formatPrice(((item.salePrice ?? item.price) ?? 0) * item.quantity)}</td>
    </tr>`
    )
    .join('')

  return `
<!DOCTYPE html>
<html lang="sr">
<head><meta charset="UTF-8"><title>Nova narudzbina</title></head>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333">
  <h2 style="border-bottom:2px solid #333;padding-bottom:10px">Nova narudzbina</h2>

  <h3>Podaci kupca</h3>
  <table style="width:100%;border-collapse:collapse">
    <tr><td style="padding:4px 8px;width:140px;color:#666">Ime i prezime:</td><td style="padding:4px 8px"><strong>${form.ime} ${form.prezime}</strong></td></tr>
    <tr><td style="padding:4px 8px;color:#666">Email:</td><td style="padding:4px 8px">${form.email}</td></tr>
    <tr><td style="padding:4px 8px;color:#666">Telefon:</td><td style="padding:4px 8px">${form.telefon}</td></tr>
    <tr><td style="padding:4px 8px;color:#666">Adresa:</td><td style="padding:4px 8px">${form.adresa}</td></tr>
    <tr><td style="padding:4px 8px;color:#666">Grad:</td><td style="padding:4px 8px">${form.grad} ${form.postanskiBroj}</td></tr>
    ${form.napomena ? `<tr><td style="padding:4px 8px;color:#666">Napomena:</td><td style="padding:4px 8px">${form.napomena}</td></tr>` : ''}
  </table>

  <h3 style="margin-top:24px">Naručeni proizvodi</h3>
  <table style="width:100%;border-collapse:collapse">
    <thead>
      <tr style="background:#f5f5f5">
        <th style="padding:8px;text-align:left">Proizvod</th>
        <th style="padding:8px;text-align:center">Kol.</th>
        <th style="padding:8px;text-align:right">Cena</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>${buildTotalsRows(total)}</tfoot>
  </table>

  <p style="margin-top:24px;padding:12px;background:#f9f9f9;border-radius:4px;font-size:14px;color:#666">
    Plaćanje: Pouzećem pri dostavi
  </p>
</body>
</html>`
}

function buildCustomerHtml(form: OrderFormData, items: CartItem[], total: number) {
  const rows = items
    .map(
      (item) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee">${item.name}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${formatPrice(((item.salePrice ?? item.price) ?? 0) * item.quantity)}</td>
    </tr>`
    )
    .join('')

  return `
<!DOCTYPE html>
<html lang="sr">
<head><meta charset="UTF-8"><title>Potvrda narudzbine</title></head>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333">

  <h2 style="border-bottom:2px solid #333;padding-bottom:10px">Hvala na narudžbini, ${form.ime}!</h2>

  <p style="font-size:15px;line-height:1.6;color:#555">
    Primili smo vašu narudžbinu i uskoro ćemo vas kontaktirati radi potvrde i dogovora oko dostave.
  </p>

  <h3 style="margin-top:24px">Pregled narudžbine</h3>
  <table style="width:100%;border-collapse:collapse">
    <thead>
      <tr style="background:#f5f5f5">
        <th style="padding:8px;text-align:left">Proizvod</th>
        <th style="padding:8px;text-align:center">Kol.</th>
        <th style="padding:8px;text-align:right">Cena</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>${buildTotalsRows(total)}</tfoot>
  </table>

  <h3 style="margin-top:24px">Adresa za dostavu</h3>
  <table style="width:100%;border-collapse:collapse">
    <tr><td style="padding:4px 8px;width:140px;color:#666">Ime i prezime:</td><td style="padding:4px 8px">${form.ime} ${form.prezime}</td></tr>
    <tr><td style="padding:4px 8px;color:#666">Adresa:</td><td style="padding:4px 8px">${form.adresa}</td></tr>
    <tr><td style="padding:4px 8px;color:#666">Grad:</td><td style="padding:4px 8px">${form.grad} ${form.postanskiBroj}</td></tr>
    <tr><td style="padding:4px 8px;color:#666">Telefon:</td><td style="padding:4px 8px">${form.telefon}</td></tr>
    ${form.napomena ? `<tr><td style="padding:4px 8px;color:#666">Napomena:</td><td style="padding:4px 8px">${form.napomena}</td></tr>` : ''}
  </table>

  <p style="margin-top:24px;padding:12px;background:#f9f9f9;border-radius:4px;font-size:14px;color:#666">
    Plaćanje: Pouzećem pri dostavi
  </p>

  <p style="margin-top:32px;font-size:13px;color:#999;border-top:1px solid #eee;padding-top:16px">
    Ovaj mail je automatski poslan od strane ${SITE_NAME}. Ukoliko imate pitanja, kontaktirajte nas na
    <a href="mailto:${process.env.SITE_MAIL_RECEIVER}" style="color:#555">${process.env.SITE_MAIL_RECEIVER}</a>.
  </p>
</body>
</html>`
}

export async function sendOrderEmail(form: OrderFormData, items: CartItem[], total: number) {
  const client = new Mailjet({
    apiKey: process.env.MAILJET_API_KEY!,
    apiSecret: process.env.MAILJET_SECRET_KEY!,
  })

  const from = {
    Email: process.env.SITE_MAIL_SENDER!,
    Name: SITE_NAME,
  }

  await client.post('send', { version: 'v3.1' }).request({
    Messages: [
      {
        From: from,
        To: [{ Email: process.env.SITE_MAIL_RECEIVER! }],
        Subject: `Nova narudžbina — ${form.ime} ${form.prezime}`,
        HTMLPart: buildOwnerHtml(form, items, total),
      },
      {
        From: from,
        To: [{ Email: form.email, Name: `${form.ime} ${form.prezime}` }],
        ReplyTo: { Email: process.env.SITE_MAIL_RECEIVER! },
        Subject: `Potvrda narudžbine — ${SITE_NAME}`,
        HTMLPart: buildCustomerHtml(form, items, total),
      },
    ],
  })
}
