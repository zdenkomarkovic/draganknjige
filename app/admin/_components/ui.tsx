'use client'

import { useActionState } from 'react'
import type { FormState } from '../actions'

export const inputCls =
  'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand'
export const btnCls =
  'inline-flex items-center justify-center rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60 transition-colors'
export const btnGhostCls =
  'inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors'
export const btnDangerCls =
  'inline-flex items-center justify-center rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 transition-colors'

export function Field({
  label,
  hint,
  children,
  className = '',
}: {
  label: string
  hint?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
      {children}
      {hint && <span className="block text-xs text-gray-500 mt-1">{hint}</span>}
    </label>
  )
}

export function Check({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4 rounded border-gray-300" />
      {label}
    </label>
  )
}

/** Forma vezana za server akciju: prikazuje grešku/poruku i onemogućava dugme dok traje slanje. */
export function ActionForm({
  action,
  children,
  submitLabel = 'Sačuvaj',
  className = '',
  encType,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>
  children: React.ReactNode
  submitLabel?: string
  className?: string
  encType?: string
}) {
  const [state, formAction, pending] = useActionState(action, {} as FormState)
  return (
    <form action={formAction} className={className} encType={encType}>
      {children}
      {state.error && (
        <p role="alert" className="mt-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="mt-4 rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">{state.ok}</p>
      )}
      <div className="mt-5">
        <button type="submit" disabled={pending} className={btnCls}>
          {pending ? 'Čuvanje…' : submitLabel}
        </button>
      </div>
    </form>
  )
}

/** Dugme za opasne akcije: traži potvrdu u browseru pre slanja. */
export function ConfirmButton({ children, message, className }: { children: React.ReactNode; message: string; className?: string }) {
  return (
    <button
      type="submit"
      className={className ?? btnDangerCls}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault()
      }}
    >
      {children}
    </button>
  )
}
