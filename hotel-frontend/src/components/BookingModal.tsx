'use client'

import { useState } from 'react'
import api from '@/lib/api'
import { AvailableRoom } from '@/lib/types'
import { useAuth } from '@/context/AuthContext'

interface Props {
  room: AvailableRoom
  checkIn: string
  checkOut: string
  onClose: () => void
  onSuccess: () => void
}

const SERVICES = [
  { id: 'spa', label: 'SPA & Велнес', desc: 'Одноразовий сеанс масажу + сауна', price: 50, perNight: false, icon: '✦' },
  { id: 'pool', label: 'Басейн', desc: 'Доступ протягом усього перебування', price: 20, perNight: true, icon: '◈' },
  { id: 'fitness', label: 'Фітнес-центр', desc: 'Доступ протягом усього перебування', price: 10, perNight: true, icon: '◆' },
]

const BREAKFAST_SERVICE = { id: 'breakfast', label: 'Сніданок', desc: 'Шведський стіл щодня 7:00–11:00', price: 15, perNight: true, icon: '◇' }

export default function BookingModal({ room, checkIn, checkOut, onClose, onSuccess }: Props) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const nights = room.nights ?? Math.ceil(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000
  )

  const breakfastIncluded = room.roomType === 'Deluxe' || room.roomType === 'Suite'
  const availableServices = breakfastIncluded ? SERVICES : [BREAKFAST_SERVICE, ...SERVICES]

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const serviceTotal = availableServices
    .filter(s => selected.has(s.id))
    .reduce((sum, s) => sum + (s.perNight ? s.price * nights : s.price), 0)

  const basePrice = room.calculatedPrice ?? room.price * nights
  const totalPrice = basePrice + serviceTotal

  const handleBook = async () => {
    if (!user?.clientId) { setError('Для бронювання потрібен профіль клієнта'); return }
    setLoading(true); setError('')
    try {
      await api.post('/api/reservations', {
        clientId: user.clientId,
        roomId: room.roomId,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        additionalServicesPrice: serviceTotal,
      })
      onSuccess()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || 'Помилка бронювання')
    } finally {
      setLoading(false)
    }
  }

  const ROOM_TYPE_UA: Record<string, string> = { Standard: 'Стандарт', Deluxe: 'Делюкс', Suite: 'Сюїт' }

  return (
    <div className="fixed inset-0 bg-graphite/70 flex items-center justify-center z-50 px-4 py-6 overflow-y-auto">
      <div className="bg-warm-white w-full max-w-lg shadow-2xl my-auto">

        {/* Header */}
        <div className="bg-brown px-8 py-6 flex items-start justify-between">
          <div>
            <p className="text-gold text-[10px] tracking-[0.4em] uppercase mb-1">Бронювання</p>
            <h2 className="font-serif text-2xl text-white">Кімната №{room.roomNumber}</h2>
            <p className="text-white/50 text-xs mt-0.5 tracking-wide">{ROOM_TYPE_UA[room.roomType] ?? room.roomType}</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors text-2xl leading-none mt-1">×</button>
        </div>

        <div className="px-8 py-6 space-y-6">

          {/* Dates summary */}
          <div className="grid grid-cols-3 gap-px bg-beige">
            {[
              { label: 'Заїзд', value: new Date(checkIn).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' }) },
              { label: 'Виїзд', value: new Date(checkOut).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' }) },
              { label: 'Ночей', value: String(nights) },
            ].map(item => (
              <div key={item.label} className="bg-cream px-4 py-3 text-center">
                <p className="text-[10px] tracking-[0.25em] uppercase text-brown-light mb-0.5">{item.label}</p>
                <p className="font-serif text-base text-brown">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Included breakfast badge */}
          {breakfastIncluded && (
            <div className="flex items-center gap-3 bg-gold/10 border border-gold/30 px-4 py-3">
              <span className="text-gold text-lg">◇</span>
              <div>
                <p className="text-sm font-medium text-brown">Сніданок включено</p>
                <p className="text-xs text-brown-light">Шведський стіл щодня з 7:00 до 11:00</p>
              </div>
            </div>
          )}

          {/* Additional services */}
          <div>
            <p className="text-[10px] tracking-[0.35em] uppercase text-brown-light mb-3">Додаткові послуги</p>
            <div className="space-y-2">
              {availableServices.map(s => {
                const isOn = selected.has(s.id)
                const cost = s.perNight ? s.price * nights : s.price
                return (
                  <button key={s.id} onClick={() => toggle(s.id)}
                    className={`w-full flex items-center gap-4 px-4 py-3 border text-left transition-all duration-200 ${
                      isOn ? 'border-gold bg-gold/5' : 'border-beige bg-ivory hover:border-brown-light'
                    }`}>
                    <span className={`text-base shrink-0 transition-colors ${isOn ? 'text-gold' : 'text-beige'}`}>{s.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isOn ? 'text-brown' : 'text-brown-mid'}`}>{s.label}</p>
                      <p className="text-xs text-brown-light truncate">{s.desc}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-medium ${isOn ? 'text-gold' : 'text-brown-light'}`}>+${cost}</p>
                      {s.perNight && <p className="text-[10px] text-brown-light">${s.price}/ніч</p>}
                    </div>
                    <div className={`w-4 h-4 border shrink-0 flex items-center justify-center transition-all ${
                      isOn ? 'bg-gold border-gold' : 'border-beige'
                    }`}>
                      {isOn && <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 fill-ivory"><path d="M10 3L5 8.5 2 5.5"/><path d="M10 3L5 8.5 2 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Price breakdown */}
          <div className="border-t border-beige pt-4 space-y-2">
            <div className="flex justify-between text-sm text-brown-mid">
              <span>Проживання ({nights} ночей)</span>
              <span>${basePrice.toFixed(2)}</span>
            </div>
            {serviceTotal > 0 && (
              <div className="flex justify-between text-sm text-brown-mid">
                <span>Послуги</span>
                <span>+${serviceTotal.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-2 border-t border-beige">
              <span className="text-xs tracking-[0.3em] uppercase text-brown-light">Разом</span>
              <span className="font-serif text-2xl text-gold">${totalPrice.toFixed(2)}</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">{error}</div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose}
              className="flex-1 border border-beige text-brown-mid py-3 text-xs tracking-[0.3em] uppercase hover:border-brown-light transition-colors">
              Скасувати
            </button>
            <button onClick={handleBook} disabled={loading}
              className="flex-1 bg-brown text-ivory py-3 text-xs tracking-[0.3em] uppercase hover:bg-gold transition-colors duration-300 disabled:opacity-50">
              {loading ? 'Обробка...' : 'Підтвердити'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
