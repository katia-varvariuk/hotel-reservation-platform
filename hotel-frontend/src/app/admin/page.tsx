'use client'

import { useState, useEffect } from 'react'
import api from '@/lib/api'
import { Statistics } from '@/lib/types'

const STATUS_UA: Record<string, string> = {
  Pending: 'Очікує', Confirmed: 'Підтверджено', CheckedIn: 'Заселено',
  CheckedOut: 'Виселено', Cancelled: 'Скасовано',
}
const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-amber-400', Confirmed: 'bg-gold', CheckedIn: 'bg-emerald-500',
  CheckedOut: 'bg-slate-400', Cancelled: 'bg-red-400',
}
const STATUS_DOT: Record<string, string> = {
  Pending: 'bg-amber-400', Confirmed: 'bg-gold', CheckedIn: 'bg-emerald-500',
  CheckedOut: 'bg-slate-300', Cancelled: 'bg-red-400',
}
const ROOM_TYPE_UA: Record<string, string> = { Standard: 'Стандарт', Deluxe: 'Делюкс', Suite: 'Сюїт' }

export default function AdminDashboard() {
  const [stats, setStats] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get<Statistics>('/api/statistics')
      .then(res => setStats(res.data))
      .catch(() => setError('Не вдалося завантажити статистику'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 bg-beige rounded w-40" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => <div key={i} className="bg-ivory rounded-2xl border border-beige-light h-24" />)}
      </div>
    </div>
  )

  if (error) return <div className="text-red-500 text-sm">{error}</div>
  if (!stats) return null

  const cards = [
    { label: 'Всього номерів',        value: stats.totalRooms,              icon: '🛏',  accent: 'text-gold-dark',    bg: 'bg-cream' },
    { label: 'Доступно сьогодні',     value: stats.availableRoomsToday,     icon: '✅',  accent: 'text-emerald-600',  bg: 'bg-sage/10' },
    { label: 'Заповненість',          value: `${stats.occupancyRateToday.toFixed(1)}%`, icon: '📊', accent: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Активні бронювання',    value: stats.activeReservations,      icon: '🔥',  accent: 'text-orange-600',   bg: 'bg-orange-50' },
    { label: 'Дохід цього місяця',    value: `$${stats.revenueThisMonth.toFixed(0)}`, icon: '💰', accent: 'text-emerald-600', bg: 'bg-sage/10' },
    { label: 'Загальний дохід',       value: `$${stats.totalRevenue.toFixed(0)}`,     icon: '💵', accent: 'text-gold-dark',    bg: 'bg-cream' },
    { label: 'Всього бронювань',      value: stats.totalReservations,       icon: '📋',  accent: 'text-brown-mid',    bg: 'bg-cream' },
    { label: 'Нових клієнтів (міс.)', value: stats.newClientsThisMonth,     icon: '👥',  accent: 'text-purple-600',   bg: 'bg-purple-50' },
  ]

  const maxRevenue = Math.max(...(stats.monthlyRevenue?.map(m => Number(m.revenue)) ?? [1]), 1)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brown">Статистика</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(card => (
          <div key={card.label} className="bg-ivory rounded-2xl border border-beige-light shadow-sm p-4">
            <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl text-lg mb-3 ${card.bg}`}>
              {card.icon}
            </div>
            <div className={`text-2xl font-bold mb-0.5 ${card.accent}`}>{card.value}</div>
            <div className="text-xs text-brown-light">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Monthly Revenue Chart */}
        {stats.monthlyRevenue && stats.monthlyRevenue.length > 0 && (
          <div className="lg:col-span-2 bg-ivory rounded-2xl border border-beige-light shadow-sm p-6">
            <h2 className="text-base font-semibold text-brown mb-5">Дохід по місяцях</h2>
            <div className="flex items-end gap-2 h-40">
              {stats.monthlyRevenue.map((m, i) => {
                const h = Math.max(4, (Number(m.revenue) / maxRevenue) * 100)
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-brown text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      ${Number(m.revenue).toFixed(0)} · {m.count} бр.
                    </div>
                    <div
                      className="w-full bg-gold/80 hover:bg-gold rounded-t transition-all duration-300"
                      style={{ height: `${h}%` }}
                    />
                    <span className="text-[9px] text-brown-light text-center leading-tight">{m.month}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Status breakdown */}
        {stats.reservationsByStatus && Object.keys(stats.reservationsByStatus).length > 0 && (
          <div className="bg-ivory rounded-2xl border border-beige-light shadow-sm p-6">
            <h2 className="text-base font-semibold text-brown mb-5">За статусом</h2>
            <div className="space-y-3">
              {Object.entries(stats.reservationsByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[status] ?? 'bg-sky-400'}`} />
                  <span className="text-xs text-brown-mid flex-1">{STATUS_UA[status] ?? status}</span>
                  <div className="w-20 bg-beige-light rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full ${STATUS_COLORS[status] ?? 'bg-sky-400'}`}
                      style={{ width: `${stats.totalReservations ? (count / stats.totalReservations) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-brown-mid w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent reservations */}
        {stats.recentReservations && stats.recentReservations.length > 0 && (
          <div className="bg-ivory rounded-2xl border border-beige-light shadow-sm p-6">
            <h2 className="text-base font-semibold text-brown mb-4">Останні бронювання</h2>
            <div className="space-y-2">
              {stats.recentReservations.map(r => (
                <div key={r.reservationId} className="flex items-center gap-3 py-2 border-b border-beige last:border-0">
                  <span className="text-xs text-brown-light w-6">#{r.reservationId}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brown truncate">{r.clientName ?? '—'}</p>
                    <p className="text-xs text-brown-light">Кімната №{r.roomNumber} · {new Date(r.checkInDate).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })}</p>
                  </div>
                  <span className="text-sm font-semibold text-gold shrink-0">${Number(r.totalPrice).toFixed(0)}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[r.status]?.replace('bg-', 'bg-').replace('-400','-100').replace('-500','-100') ?? 'bg-beige'} text-brown-mid`}>
                    {STATUS_UA[r.status] ?? r.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top rooms */}
        {stats.topRooms && stats.topRooms.length > 0 && (
          <div className="bg-ivory rounded-2xl border border-beige-light shadow-sm p-6">
            <h2 className="text-base font-semibold text-brown mb-4">Топ номерів</h2>
            <div className="space-y-3">
              {stats.topRooms.map((room, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-gold/10 text-gold-dark text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brown">Кімната №{room.roomNumber}</p>
                    <p className="text-xs text-brown-light">{ROOM_TYPE_UA[room.roomType ?? ''] ?? room.roomType} · {room.bookingCount} заселень</p>
                  </div>
                  <span className="text-sm font-semibold text-gold shrink-0">${Number(room.totalRevenue).toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
