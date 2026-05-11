'use client'

import { useState, useEffect } from 'react'
import api from '@/lib/api'
import { Reservation, Room } from '@/lib/types'

const TIER_ICONS: Record<string, string> = { new: '', regular: '★', vip: '♛' }

const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-amber-100 text-gold-dark',
  Confirmed: 'bg-beige-light text-gold-dark',
  CheckedIn: 'bg-emerald-100 text-sage',
  CheckedOut: 'bg-beige text-brown-mid',
  Cancelled: 'bg-red-100 text-red-400 line-through',
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

export default function CalendarPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [rooms, setRooms] = useState<Room[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get<Room[]>('/api/rooms'),
      api.get<Reservation[]>('/api/reservations'),
    ]).then(([r, res]) => {
      setRooms(r.data)
      setReservations(res.data.filter(r => r.status !== 'Cancelled'))
    }).finally(() => setLoading(false))
  }, [])

  const days = getDaysInMonth(year, month)
  const daysArr = Array.from({ length: days }, (_, i) => i + 1)

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11) } else setMonth(m => m - 1) }
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0) } else setMonth(m => m + 1) }

  const monthNames = ['Січень','Лютий','Березень','Квітень','Травень','Червень','Липень','Серпень','Вересень','Жовтень','Листопад','Грудень']

  const getCellReservation = (roomId: number, day: number) => {
    const date = new Date(year, month, day)
    return reservations.find(r => {
      if (r.roomId !== roomId) return false
      const ci = new Date(r.checkInDate)
      const co = new Date(r.checkOutDate)
      return date >= ci && date < co
    })
  }

  const isCheckIn = (r: Reservation, day: number) => {
    const ci = new Date(r.checkInDate)
    return ci.getFullYear() === year && ci.getMonth() === month && ci.getDate() === day
  }

  if (loading) return <div className="text-brown-light py-8 text-center">Завантаження...</div>

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-brown">Календар бронювань</h1>
        <div className="flex items-center gap-2 ml-auto">
          <button onClick={prevMonth} className="border rounded-xl px-3 py-1.5 text-sm hover:bg-cream">←</button>
          <span className="text-sm font-semibold text-brown min-w-32 text-center">{monthNames[month]} {year}</span>
          <button onClick={nextMonth} className="border rounded-xl px-3 py-1.5 text-sm hover:bg-cream">→</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="text-xs border-collapse w-full">
          <thead>
            <tr>
              <th className="border bg-cream px-3 py-2 text-left font-semibold text-brown-mid sticky left-0 z-10 min-w-20">Кімната</th>
              {daysArr.map(d => {
                const isToday = d === now.getDate() && month === now.getMonth() && year === now.getFullYear()
                const dow = new Date(year, month, d).getDay()
                const isWeekend = dow === 0 || dow === 6
                return (
                  <th key={d} className={`border px-1.5 py-2 font-medium min-w-8 text-center ${isToday ? 'bg-cream text-gold-dark' : isWeekend ? 'bg-cream text-brown-light' : 'text-brown-light'}`}>
                    {d}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {rooms.map(room => (
              <tr key={room.roomId} className="hover:bg-cream">
                <td className="border px-3 py-2 font-medium text-brown sticky left-0 bg-white z-10">
                  №{room.roomNumber}
                  <span className="text-brown-light font-normal ml-1 text-xs">{room.roomType[0]}</span>
                </td>
                {daysArr.map(d => {
                  const res = getCellReservation(room.roomId, d)
                  const color = res ? STATUS_COLORS[res.status] ?? 'bg-beige' : ''
                  const showLabel = res && isCheckIn(res, d)
                  return (
                    <td
                      key={d}
                      title={res ? `${res.clientName ?? `#${res.clientId}`}${res.clientLoyaltyTier && res.clientLoyaltyTier !== 'new' ? ` · ${res.clientLoyaltyTier === 'vip' ? 'VIP' : 'Постійний'}` : ''} | ${res.status}` : ''}
                      className={`border h-8 px-0.5 ${res ? color + ' cursor-pointer' : ''}`}
                    >
                      {showLabel && (
                        <span className="truncate text-xs font-medium flex items-center gap-0.5 px-1 leading-tight">
                          {TIER_ICONS[res!.clientLoyaltyTier ?? 'new'] && (
                            <span className="shrink-0 opacity-70">{TIER_ICONS[res!.clientLoyaltyTier ?? 'new']}</span>
                          )}
                          {res!.clientName?.split(' ')[0] ?? `#${res!.clientId}`}
                        </span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-4 mt-4 flex-wrap">
        {Object.entries({ Pending: 'Очікує', Confirmed: 'Підтверджено', CheckedIn: 'Заселено', CheckedOut: 'Виселено' }).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5 text-xs">
            <div className={`w-4 h-4 rounded ${STATUS_COLORS[k]?.split(' ')[0]}`} />
            <span className="text-brown-mid">{v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
