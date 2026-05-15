'use client'

import { useState, useEffect } from 'react'
import api from '@/lib/api'
import { Statistics } from '@/lib/types'
import { STATUS_LABELS as STATUS_UA, STATUS_DOT, ROOM_TYPE_UA } from '@/lib/constants'
import { useToast } from '@/context/ToastContext'

const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-amber-400', Confirmed: 'bg-gold', CheckedIn: 'bg-emerald-500',
  CheckedOut: 'bg-slate-400', Cancelled: 'bg-red-400',
}

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
    {
      label: 'Всього номерів', value: stats.totalRooms, accent: 'text-gold-dark', iconColor: 'stroke-gold-dark',
      icon: <><path d="M3 7h18M3 7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2M3 7V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2M8 16v-2a2 2 0 0 1 4 0v2"/></>,
    },
    {
      label: 'Доступно сьогодні', value: stats.availableRoomsToday, accent: 'text-emerald-600', iconColor: 'stroke-emerald-600',
      icon: <><path d="M20 6 9 17l-5-5"/></>,
    },
    {
      label: 'Заповненість', value: `${stats.occupancyRateToday.toFixed(1)}%`, accent: 'text-purple-600', iconColor: 'stroke-purple-600',
      icon: <><rect x="2" y="12" width="4" height="9" rx="1"/><rect x="9" y="7" width="4" height="14" rx="1"/><rect x="16" y="3" width="4" height="18" rx="1"/></>,
    },
    {
      label: 'Активні бронювання', value: stats.activeReservations, accent: 'text-orange-600', iconColor: 'stroke-orange-600',
      icon: <><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>,
    },
    {
      label: 'Дохід цього місяця', value: `$${stats.revenueThisMonth.toFixed(0)}`, accent: 'text-emerald-600', iconColor: 'stroke-emerald-600',
      icon: <><circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.5a2.5 2.5 0 0 1 5 0c0 1.5-1 2-2.5 2.5S9.5 13 9.5 14.5a2.5 2.5 0 0 0 5 0"/></>,
    },
    {
      label: 'Загальний дохід', value: `$${stats.totalRevenue.toFixed(0)}`, accent: 'text-gold-dark', iconColor: 'stroke-gold-dark',
      icon: <><path d="M3 17 9 11l4 4 8-8M17 9h4v4"/></>,
    },
    {
      label: 'Всього бронювань', value: stats.totalReservations, accent: 'text-brown-mid', iconColor: 'stroke-brown-mid',
      icon: <><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></>,
    },
    {
      label: 'Нових клієнтів (міс.)', value: stats.newClientsThisMonth, accent: 'text-purple-600', iconColor: 'stroke-purple-600',
      icon: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    },
  ]

  const maxRevenue = Math.max(...(stats.monthlyRevenue?.map(m => Number(m.revenue)) ?? [1]), 1)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brown">Статистика</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(card => (
          <div key={card.label} className="bg-ivory rounded-2xl border border-beige-light shadow-sm p-4">
            <div className="mb-3">
              <svg viewBox="0 0 24 24" className={`w-5 h-5 fill-none ${card.iconColor}`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                {card.icon}
              </svg>
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
