import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/admin/auth'
import { getProduct, listCategoriesAdmin } from '@/lib/admin/data'
import { imageUrl } from '@/lib/images'
import {
  deleteImageAction,
  deleteProductAction,
  saveProductAction,
  setMainImageAction,
  uploadImagesAction,
} from '../../../actions'
import { ActionForm, btnGhostCls, Check, ConfirmButton, Field, inputCls } from '../../../_components/ui'

export const metadata = { title: 'Proizvod' }

export default async function ProductEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ ok?: string }>
}) {
  await requireUser()
  const { id: rawId } = await params
  const { ok } = await searchParams
  const isNew = rawId === 'novi'
  const productId = Number(rawId)
  if (!isNew && !Number.isInteger(productId)) notFound()

  const [data, cats] = await Promise.all([isNew ? null : getProduct(productId), listCategoriesAdmin()])
  if (!isNew && !data) notFound()
  const p = data?.product
  const placement = p?.subcategory_id ? `s:${p.subcategory_id}` : p?.category_id ? `c:${p.category_id}` : ''

  return (
    <div className="max-w-4xl">
      <p className="text-sm mb-2">
        <Link href="/admin/proizvodi/" className="text-gray-500 hover:text-black">
          ← Proizvodi
        </Link>
      </p>
      <div className="flex items-start justify-between gap-3 flex-wrap mb-5">
        <h1 className="text-2xl font-semibold font-serif">{isNew ? 'Novi proizvod' : p!.name}</h1>
        {!isNew && p!.visible === 1 && (
          <Link href={`/shop/${p!.slug}/`} target="_blank" className={btnGhostCls}>
            Pogledaj na sajtu ↗
          </Link>
        )}
      </div>
      {ok && <p className="mb-4 rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">Sačuvano.</p>}
      {p && p.import_status !== 'done' && (
        <p className="mb-4 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
          Ovaj oglas još nije potpuno uvezen sa KupujemProdajem (status: {p.import_status}). Pun opis i slike stižu kasnije, a ručne
          izmene opisa će tada biti prepisane.
        </p>
      )}

      <ActionForm action={saveProductAction} className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
        {p && <input type="hidden" name="id" value={p.id} />}
        <Field label="Naziv">
          <input name="name" required defaultValue={p?.name} className={inputCls} />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Kategorija / podkategorija">
            <select name="placement" defaultValue={placement} className={inputCls}>
              <option value="">— bez kategorije —</option>
              {cats.map((c) => (
                <optgroup key={c.id} label={c.name}>
                  <option value={`c:${c.id}`}>Cela kategorija: {c.name}</option>
                  {c.subs.map((s) => (
                    <option key={s.id} value={`s:${s.id}`}>
                      {s.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Field>
          <Field label="Slug (deo adrese)" hint="Prazno = automatski iz naziva.">
            <input name="slug" defaultValue={p?.slug} className={inputCls} />
          </Field>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Cena (RSD)">
            <input name="price" inputMode="numeric" defaultValue={p?.price ?? ''} className={inputCls} />
          </Field>
          <Field label="Akcijska cena (RSD)">
            <input name="salePrice" inputMode="numeric" defaultValue={p?.sale_price ?? ''} className={inputCls} />
          </Field>
          <Field label="Stanje">
            <input name="condition" list="stanja" defaultValue={p?.condition ?? ''} className={inputCls} />
            <datalist id="stanja">
              <option value="Novo" />
              <option value="Korišćeno (polovno)" />
            </datalist>
          </Field>
        </div>
        <div className="flex gap-6 flex-wrap">
          <Check name="visible" label="Vidljiv na sajtu" defaultChecked={isNew ? true : p!.visible === 1} />
          <Check name="inStock" label="Na stanju" defaultChecked={isNew ? true : p!.in_stock === 1} />
          <Check name="featured" label="Istaknut" defaultChecked={p?.featured === 1} />
        </div>
        <Field label="Kratak opis (kartica)" hint="Do 255 znakova.">
          <textarea name="shortDescription" rows={2} maxLength={255} defaultValue={p?.short_description ?? ''} className={inputCls} />
        </Field>
        <Field label="Opis" hint="Svaki novi red je novi pasus.">
          <textarea name="description" rows={9} defaultValue={p?.description ?? ''} className={inputCls} />
        </Field>
        <Field label="Kratak tekst ispod cene (opciono)">
          <textarea name="summary" rows={3} defaultValue={p?.summary ?? ''} className={inputCls} />
        </Field>
        <details className="rounded-md border border-gray-200 p-3">
          <summary className="cursor-pointer text-sm font-medium">SEO</summary>
          <div className="mt-3 space-y-4">
            <Field label="SEO naslov">
              <input name="seoTitle" defaultValue={p?.seo_title ?? ''} className={inputCls} />
            </Field>
            <Field label="SEO opis">
              <textarea name="seoDescription" rows={2} defaultValue={p?.seo_description ?? ''} className={inputCls} />
            </Field>
          </div>
        </details>
      </ActionForm>

      {p && (
        <>
          <section className="mt-8 rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="text-lg font-semibold font-serif mb-4">Slike ({data!.images.length})</h2>
            {data!.images.length === 0 && <p className="text-sm text-gray-500 mb-4">Proizvod nema slika.</p>}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
              {data!.images.map((img, i) => (
                <div key={img.id} className="rounded-lg border border-gray-200 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl(img.path)} alt="" className="h-40 w-full object-contain bg-gray-50 rounded" loading="lazy" />
                  <p className="text-xs text-center text-gray-500 mt-1">{i === 0 ? 'Glavna slika' : `Slika ${i + 1}`}</p>
                  <div className="flex gap-1 mt-2 justify-center">
                    {i > 0 && (
                      <form action={setMainImageAction}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="imageId" value={img.id} />
                        <button className={btnGhostCls}>Glavna</button>
                      </form>
                    )}
                    <form action={deleteImageAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="imageId" value={img.id} />
                      <ConfirmButton message="Obrisati ovu sliku?">Obriši</ConfirmButton>
                    </form>
                  </div>
                </div>
              ))}
            </div>
            <ActionForm action={uploadImagesAction} submitLabel="Dodaj slike">
              <input type="hidden" name="id" value={p.id} />
              <Field label="Nove slike" hint="JPG, PNG ili WebP do 12 MB. Automatski se smanjuju na 800 px.">
                <input type="file" name="images" accept="image/*" multiple className="text-sm" />
              </Field>
            </ActionForm>
          </section>

          <section className="mt-8 rounded-xl border border-red-200 bg-white p-5">
            <h2 className="text-lg font-semibold font-serif mb-2">Brisanje</h2>
            <p className="text-sm text-gray-600 mb-3">
              Ako samo ne želiš da proizvod bude na sajtu, bolje ga sakrij. Brisanje je trajno i uklanja i slike.
              {p.kp_id ? ' Obrisan oglas sa KupujemProdajem se vraća pri ponovnom pokretanju uvoza.' : ''}
            </p>
            <form action={deleteProductAction}>
              <input type="hidden" name="id" value={p.id} />
              <ConfirmButton message="Trajno obrisati proizvod i sve njegove slike?">Obriši proizvod</ConfirmButton>
            </form>
          </section>
        </>
      )}
    </div>
  )
}
