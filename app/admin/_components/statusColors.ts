// Boje statusa u adminu: aktivan filter ima punu boju, a status u tabeli je "značka" iste boje.
export const STATUS_STYLE: Record<string, { active: string; badge: string; dot: string }> = {
  all: {
    active: 'bg-gray-800 border-gray-800 text-white',
    badge: 'bg-gray-100 text-gray-700',
    dot: 'bg-gray-500',
  },
  nova: {
    active: 'bg-blue-600 border-blue-600 text-white',
    badge: 'bg-blue-100 text-blue-800',
    dot: 'bg-blue-600',
  },
  potvrdjena: {
    active: 'bg-amber-500 border-amber-500 text-white',
    badge: 'bg-amber-100 text-amber-800',
    dot: 'bg-amber-500',
  },
  poslata: {
    active: 'bg-violet-600 border-violet-600 text-white',
    badge: 'bg-violet-100 text-violet-800',
    dot: 'bg-violet-600',
  },
  zavrsena: {
    active: 'bg-green-600 border-green-600 text-white',
    badge: 'bg-green-100 text-green-800',
    dot: 'bg-green-600',
  },
  otkazana: {
    active: 'bg-red-600 border-red-600 text-white',
    badge: 'bg-red-100 text-red-800',
    dot: 'bg-red-600',
  },
  odgovoreno: {
    active: 'bg-green-600 border-green-600 text-white',
    badge: 'bg-green-100 text-green-800',
    dot: 'bg-green-600',
  },
}

export const statusStyle = (s: string) => STATUS_STYLE[s] ?? STATUS_STYLE.all!
