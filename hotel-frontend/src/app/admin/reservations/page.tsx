'use client'

import { useState, useEffect, useMemo } from 'react'
import api from '@/lib/api'
import { Reservation } from '@/lib/types'
import { TIER_LABELS, STATUS_LABELS, STATUS_COLORS } from '@/lib/constants'
import { useToast } from '@/context/ToastContext'

function TierBadge({ tier }: { tier: string | null }) {
  const t = TIER_LABELS[tier ?? 'new'] ?? TIER_LABELS.new
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${t.color}`}>{t.label}</span>
}
const ALL_STATUSES = ['Pending', 'Confirmed', 'CheckedIn', 'CheckedOut', 'Cancelled']

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionId, setActionId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const load = async () => {
    try {
      const res = await api.get<Reservation[]>('/api/reservations')
      setReservations(res.data)
    } catch {
      setError('Не вдалося завантажити')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    let list = reservations
    if (statusFilter !== 'all') list = list.filter(r => r.status === statusFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(r =>
        r.clientName?.toLowerCase().includes(q) ||
        r.roomNumber?.toLowerCase().includes(q) ||
        String(r.reservationId).includes(q)
      )
    }
    return list
  }, [reservations, statusFilter, search])

  const doAction = async (id: number, action: 'confirm' | 'checkin' | 'checkout' | 'cancel') => {
    setActionId(id); setError('')
    try {
      await api.post(`/api/reservations/${id}/${action}`)
      await load()
    } catch {
      setError(`Помилка дії: ${action}`)
    } finally {
      setActionId(null)
    }
  }

  const getActions = (r: Reservation) => {
    switch (r.status) {
      case 'Pending':    return [{ label: 'Підтвердити', action: 'confirm'  as const, color: 'text-gold-dark' }, { label: 'Скасувати', action: 'cancel' as const, color: 'text-red-600' }]
      case 'Confirmed':  return [{ label: 'Заселити',    action: 'checkin'  as const, color: 'text-green-600' }, { label: 'Скасувати', action: 'cancel' as const, color: 'text-red-600' }]
      case 'CheckedIn':  return [{ label: 'Виселити',    action: 'checkout' as const, color: 'text-purple-600' }]
      default: return []
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-brown">Всі бронювання</h1>
        <span className="text-sm text-brown-light">{filtered.length} з {reservations.length}</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Пошук клієнта, кімнати, #ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-beige rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-gold w-64"
        />
        <div className="flex gap-1 flex-wrap">
          <button onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs rounded-xl border transition-colors ${statusFilter === 'all' ? 'bg-brown text-ivory border-brown' : 'border-beige text-brown-mid hover:bg-cream'}`}>
            Усі
          </button>
          {ALL_STATUSES.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs rounded-xl border transition-colors ${statusFilter === s ? 'bg-brown text-ivory border-brown' : 'border-beige text-brown-mid hover:bg-cream'}`}>
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="bg-ivory rounded-2xl border h-16 animate-pulse" />)}</div>
      ) : (
        <div className="bg-ivory rounded-2xl border border-beige-light shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream border-b border-beige-light">
              <tr>
                {['ID', 'Клієнт', 'Лояльність', 'Кімната', 'Заїзд', 'Виїзд', 'Вартість', 'Статус', 'Дії'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-brown-light uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(r => (
                <tr key={r.reservationId} className="hover:bg-cream transition-colors">
                  <td className="px-4 py-3 font-semibold text-brown-mid">#{r.reservationId}</td>
                  <td className="px-4 py-3 text-brown-mid">{r.clientName ?? `#${r.clientId}`}</td>
                  <td className="px-4 py-3"><TierBadge tier={r.clientLoyaltyTier} /></td>
                  <td className="px-4 py-3 text-brown-mid">№{r.roomNumber ?? r.roomId}</td>
                  <td className="px-4 py-3 text-brown-mid">{new Date(r.checkInDate).toLocaleDateString('uk-UA')}</td>
                  <td className="px-4 py-3 text-brown-mid">{new Date(r.checkOutDate).toLocaleDateString('uk-UA')}</td>
                  <td className="px-4 py-3 font-semibold text-brown">${r.totalPrice.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUS_COLORS[r.status] ?? 'bg-beige-light text-brown-mid'}`}>
                      {STATUS_LABELS[r.status] ?? r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      {getActions(r).map(a => (
                        <button key={a.action} onClick={() => doAction(r.reservationId, a.action)}
                          disabled={actionId === r.reservationId}
                          className={`${a.color} hover:underline text-xs font-semibold disabled:opacity-50`}>
                          {actionId === r.reservationId ? '...' : a.label}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="text-center text-brown-light py-10">Немає бронювань</p>}
        </div>
      )}
    </div>
  )
}
