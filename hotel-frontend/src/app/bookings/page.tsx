'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { Reservation } from '@/lib/types'
import { STATUS_LABELS } from '@/lib/constants'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'

const STATUS_STYLES: Record<string, string> = {
  Pending: 'bg-gold/10 text-gold-dark border border-gold/40',
  Confirmed: 'bg-sage/10 text-sage border border-sage/40',
  CheckedIn: 'bg-brown/10 text-brown border border-brown/20',
  CheckedOut: 'bg-beige text-brown-light border border-beige',
  Cancelled: 'bg-red-50 text-red-600 border border-red-200',
}

const STATUS_FILTERS = ['all', 'Pending', 'Confirmed', 'CheckedIn', 'CheckedOut', 'Cancelled']

export default function BookingsPage() {
  const { user } = useAuth()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancelling, setCancelling] = useState<number | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filtered = statusFilter === 'all' ? reservations : reservations.filter(r => r.status === statusFilter)

  const load = async () => {
    if (!user?.clientId) return
    try {
      const res = await api.get<Reservation[]>(`/api/reservations/by-client/${user.clientId}`)
      setReservations(res.data)
    } catch { setError('Не вдалося завантажити бронювання') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [user])

  const cancel = async (id: number) => {
    if (!confirm('Скасувати бронювання?')) return
    setCancelling(id)
    try {
      await api.post(`/api/reservations/${id}/cancel`)
      await load()
    } catch { setError('Не вдалося скасувати бронювання') }
    finally { setCancelling(null) }
  }

  return (
    <>
      {/* Page header */}
      <div className="bg-brown py-16 px-6 -mt-20 pt-36">
        <div className="max-w-5xl mx-auto">
          <p className="text-gold text-[10px] tracking-[0.5em] uppercase mb-3">Особистий кабінет</p>
          <h1 className="font-serif text-4xl md:text-5xl text-white">Мої бронювання</h1>
          {!loading && (
            <p className="text-white/40 text-sm mt-3 tracking-wide">{reservations.length} {reservations.length === 1 ? 'бронювання' : 'бронювань'}</p>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">

        {/* Filter tabs */}
        {reservations.length > 0 && (
          <div className="flex gap-1 flex-wrap mb-8 border-b border-beige pb-0">
            {STATUS_FILTERS.map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-5 py-3 text-xs tracking-[0.25em] uppercase transition-all border-b-2 -mb-px ${
                  statusFilter === s
                    ? 'border-gold text-brown font-medium'
                    : 'border-transparent text-brown-light hover:text-brown'
                }`}>
                {s === 'all' ? `Усі (${reservations.length})` : `${STATUS_LABELS[s]} (${reservations.filter(r => r.status === s).length})`}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div className="border border-red-200 bg-red-50 text-red-700 text-sm px-5 py-4 mb-6">{error}</div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-28 bg-beige/30 animate-pulse" />
            ))}
          </div>
        ) : reservations.length === 0 ? (
          <div className="text-center py-24">
            <p className="font-serif text-5xl text-beige mb-6">—</p>
            <p className="font-serif text-2xl text-brown-mid mb-2">Бронювань ще немає</p>
            <p className="text-sm text-brown-light mb-8">Знайдіть ідеальний номер і забронюйте прямо зараз</p>
            <Link href="/"
              className="inline-block bg-brown text-ivory px-8 py-3 text-xs tracking-[0.3em] uppercase hover:bg-gold transition-colors duration-300">
              Переглянути номери
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-serif text-xl text-brown-mid">Немає бронювань з цим статусом</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(r => (
              <div key={r.reservationId} className="bg-ivory border border-beige hover:border-brown-light transition-colors group">
                <div className="p-6 flex items-center gap-6">
                  {/* ID + status */}
                  <div className="shrink-0 text-center w-16">
                    <p className="text-[10px] tracking-[0.3em] uppercase text-brown-light mb-1">#{r.reservationId}</p>
                    <span className={`text-[10px] tracking-[0.15em] uppercase px-2 py-1 font-medium ${STATUS_STYLES[r.status] ?? 'bg-beige text-brown-mid'}`}>
                      {STATUS_LABELS[r.status] ?? r.status}
                    </span>
                  </div>

                  <div className="w-px h-12 bg-beige shrink-0" />

                  {/* Room */}
                  <div className="shrink-0 w-24">
                    <p className="text-[10px] tracking-[0.25em] uppercase text-brown-light mb-1">Номер</p>
                    <p className="font-serif text-lg text-brown leading-none">№{r.roomNumber ?? r.roomId}</p>
                  </div>

                  {/* Dates */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] tracking-[0.25em] uppercase text-brown-light mb-1.5">Дати</p>
                    <div className="flex items-center gap-2 text-sm text-brown">
                      <span>{new Date(r.checkInDate).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      <span className="text-beige">→</span>
                      <span>{new Date(r.checkOutDate).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="shrink-0 text-right">
                    <p className="text-[10px] tracking-[0.25em] uppercase text-brown-light mb-1">Вартість</p>
                    <p className="font-serif text-xl text-gold">${r.totalPrice.toFixed(2)}</p>
                  </div>

                  {/* Cancel */}
                  {(r.status === 'Pending' || r.status === 'Confirmed') && (
                    <div className="shrink-0 pl-4 border-l border-beige">
                      <button onClick={() => cancel(r.reservationId)} disabled={cancelling === r.reservationId}
                        className="text-xs text-brown-light hover:text-red-500 tracking-wide transition-colors disabled:opacity-40">
                        {cancelling === r.reservationId ? '...' : 'Скасувати'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
