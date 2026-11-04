import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/admin/auth'
import { getSubcategoryAdmin, listCategoriesAdmin } from '@/lib/admin/data'
import { saveSubcategoryAction } from '../../../../actions'
import { ActionForm, Check, Field, inputCls } from '../../../../_components/ui'

export const metadata = { title: 'Podkategorija' }

export default async function SubcategoryEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser()
  const { id } = await params
  const isNew = id === 'novi'
  if (!isNew && !Number.isInteger(Number(id))) notFound()
  const [s, cats] = await Promise.all([isNew ? null : getSubcategoryAdmin(Number(id)), listCategoriesAdmin()])
  if (!isNew && !s) notFound()

  return (
    <div className="max-w-2xl">
      <p className="text-sm mb-2">
        <Link href="/admin/kategorije/" className="text-gray-500 hover:text-black">
          ← Kategorije
        </Link>
      </p>
      <h1 className="text-2xl font-semibold font-serif mb-5">{isNew ? 'Nova podkategorija' : s!.name}</h1>
      <ActionForm action={saveSubcategoryAction} className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
        {s && <input type="hidden" name="id" value={s.id} />}
        <Field label="Kategorija">
          <select name="categoryId" required defaultValue={s?.category_id ?? ''} className={inputCls}>
            <option value="" disabled>
              — izaberi —
            </option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Naziv">
            <input name="name" required defaultValue={s?.name} className={inputCls} />
          </Field>
          <Field label="Slug" hint="Prazno = automatski.">
            <input name="slug" defaultValue={s?.slug} className={inputCls} />
          </Field>
        </div>
        <Check name="visible" label="Vidljiva na sajtu" defaultChecked={isNew ? true : s!.visible === 1} />
        <Field label="SEO naslov">
          <input name="seoTitle" defaultValue={s?.seo_title ?? ''} className={inputCls} />
        </Field>
        <Field label="SEO opis">
          <textarea name="seoDescription" rows={2} defaultValue={s?.seo_description ?? ''} className={inputCls} />
        </Field>
      </ActionForm>
    </div>
  )
}
