import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/admin/auth'
import { getCategoryAdmin } from '@/lib/admin/data'
import { saveCategoryAction } from '../../../actions'
import { ActionForm, Check, Field, inputCls } from '../../../_components/ui'

export const metadata = { title: 'Kategorija' }

export default async function CategoryEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ ok?: string }>
}) {
  await requireUser()
  const { id } = await params
  const { ok } = await searchParams
  const isNew = id === 'novi'
  if (!isNew && !Number.isInteger(Number(id))) notFound()
  const c = isNew ? null : await getCategoryAdmin(Number(id))
  if (!isNew && !c) notFound()

  return (
    <div className="max-w-3xl">
      <p className="text-sm mb-2">
        <Link href="/admin/kategorije/" className="text-gray-500 hover:text-black">
          ← Kategorije
        </Link>
      </p>
      <h1 className="text-2xl font-semibold font-serif mb-5">{isNew ? 'Nova kategorija' : c!.name}</h1>
      {ok && <p className="mb-4 rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">Sačuvano.</p>}
      <ActionForm action={saveCategoryAction} className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
        {c && <input type="hidden" name="id" value={c.id} />}
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Naziv">
            <input name="name" required defaultValue={c?.name} className={inputCls} />
          </Field>
          <Field label="Slug" hint="Prazno = automatski. Menjanje menja adresu stranice.">
            <input name="slug" defaultValue={c?.slug} className={inputCls} />
          </Field>
        </div>
        <Check name="visible" label="Vidljiva na sajtu" defaultChecked={isNew ? true : c!.visible === 1} />
        <Field label="Kratak opis" hint="Prikazuje se na stranici kategorije ispod naslova.">
          <textarea name="description" rows={2} defaultValue={c?.description ?? ''} className={inputCls} />
        </Field>
        <Field
          label="Tekst stranice (HTML)"
          hint="Prikazuje se na stranici /naziv-kategorije/. Naslov koji počinje sa „FAQ“ i sve posle njega ide ispod proizvoda."
        >
          <textarea name="body" rows={12} defaultValue={c?.body ?? ''} className={`${inputCls} font-mono`} />
        </Field>
        <details className="rounded-md border border-gray-200 p-3">
          <summary className="cursor-pointer text-sm font-medium">SEO</summary>
          <div className="mt-3 space-y-4">
            <Field label="SEO naslov (stranica proizvoda kategorije)">
              <input name="seoTitle" defaultValue={c?.seo_title ?? ''} className={inputCls} />
            </Field>
            <Field label="SEO opis (stranica proizvoda kategorije)">
              <textarea name="seoDescription" rows={2} defaultValue={c?.seo_description ?? ''} className={inputCls} />
            </Field>
            <Field label="SEO naslov (tekstualna stranica)">
              <input name="pageSeoTitle" defaultValue={c?.page_seo_title ?? ''} className={inputCls} />
            </Field>
            <Field label="SEO opis (tekstualna stranica)">
              <textarea name="pageSeoDescription" rows={2} defaultValue={c?.page_seo_description ?? ''} className={inputCls} />
            </Field>
          </div>
        </details>
      </ActionForm>
    </div>
  )
}
