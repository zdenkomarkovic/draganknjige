import { useEffect, useRef } from 'react'
import { set, useFormValue, type SlugInputProps } from 'sanity'

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/đ/g, 'dj')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

// Slug input koji prati naslov dok ga niko ručno ne izmeni
export function AutoSlugInput(props: SlugInputProps) {
  const { value, onChange, renderDefault } = props
  const name = useFormValue(['name']) as string | undefined
  // Poslednja vrednost koju smo mi upisali; ako se slug razlikuje od nje, korisnik ga je menjao
  const lastAuto = useRef<string | null>(null)

  useEffect(() => {
    const next = slugify(name ?? '')
    const current = value?.current ?? ''
    if (!next || next === current) return
    if (current === '' || current === lastAuto.current) {
      lastAuto.current = next
      onChange(set({ _type: 'slug', current: next }))
    }
  }, [name, value?.current, onChange])

  return renderDefault(props)
}
