export const ROOM_TYPE_UA: Record<string, string> = {
  Standard: 'Стандарт',
  Deluxe: 'Делюкс',
  Suite: 'Сюїт',
}

export const STATUS_LABELS: Record<string, string> = {
  Pending: 'Очікує',
  Confirmed: 'Підтверджено',
  CheckedIn: 'Заселено',
  CheckedOut: 'Виселено',
  Cancelled: 'Скасовано',
}

export const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-gold/10 text-gold-dark',
  Confirmed: 'bg-cream text-gold-dark',
  CheckedIn: 'bg-sage/10 text-sage',
  CheckedOut: 'bg-beige-light text-brown-mid',
  Cancelled: 'bg-red-50 text-red-600',
}

export const STATUS_DOT: Record<string, string> = {
  Pending: 'bg-amber-400',
  Confirmed: 'bg-gold',
  CheckedIn: 'bg-emerald-500',
  CheckedOut: 'bg-slate-300',
  Cancelled: 'bg-red-400',
}

export const TIER_LABELS: Record<string, { label: string; color: string }> = {
  new:     { label: 'Новий',     color: 'bg-slate-100 text-slate-600' },
  regular: { label: 'Постійний', color: 'bg-blue-100 text-blue-700' },
  vip:     { label: 'VIP',       color: 'bg-amber-100 text-amber-700' },
}
