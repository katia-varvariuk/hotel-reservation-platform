'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { AvailableRoom } from '@/lib/types'
import { useAuth } from '@/context/AuthContext'

const ROOM_TYPE_UA: Record<string, string> = { Standard: 'Стандарт', Deluxe: 'Делюкс', Suite: 'Сюїт' }

export default function FavoritesPage() {
  const { user } = useAuth()
  const [rooms, setRooms] = useState<AvailableRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<number | null>(null)

  const today = new Date().toISOString().split('T')[0]
  const tomorrow = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0] })()

  useEffect(() => {
    if (!user) return
    Promise.all([
      api.get<number[]>('/api/favorite'),
      api.get<AvailableRoom[]>('/api/rooms/available', { params: { checkIn: today, checkOut: tomorrow } }),
    ]).then(([favRes, roomsRes]) => {
      const favIds = new Set(favRes.data)
      setRooms(roomsRes.data.filter(r => favIds.has(r.roomId)))
    }).finally(() => setLoading(false))
  }, [user])

  const remove = async (roomId: number) => {
    setRemoving(roomId)
    await api.delete(`/api/favorite/${roomId}`)
    setRooms(rs => rs.filter(r => r.roomId !== roomId))
    setRemoving(null)
  }

  return (
    <>
      {/* Page header */}
      <div className="bg-brown py-16 px-6 -mt-20 pt-36">
        <div className="max-w-5xl mx-auto">
          <p className="text-gold text-[10px] tracking-[0.5em] uppercase mb-3">Особистий кабінет</p>
          <h1 className="font-serif text-4xl md:text-5xl text-white">Улюблені номери</h1>
          {!loading && rooms.length > 0 && (
            <p className="text-white/40 text-sm mt-3 tracking-wide">{rooms.length} збережених номерів</p>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-28 bg-beige/30 animate-pulse" />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-24">
            <div className="flex justify-center mb-6">
              <svg viewBox="0 0 24 24" className="w-16 h-16 fill-none stroke-beige" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <p className="font-serif text-2xl text-brown-mid mb-2">Список порожній</p>
            <p className="text-sm text-brown-light mb-8">Натисніть на серце на картці номера щоб зберегти його</p>
            <Link href="/"
              className="inline-block bg-brown text-ivory px-8 py-3 text-xs tracking-[0.3em] uppercase hover:bg-gold transition-colors duration-300">
              Переглянути номери
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map(r => (
              <div key={r.roomId} className="group bg-ivory border border-beige hover:border-brown-light transition-colors overflow-hidden">
                {/* Photo */}
                <Link href={`/rooms/${r.roomId}?checkIn=${today}&checkOut=${tomorrow}`} className="block relative overflow-hidden">
                  {r.photoUrl ? (
                    <img src={r.photoUrl} alt={`Кімната ${r.roomNumber}`}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-48 bg-beige/20 flex items-center justify-center">
                      <span className="font-serif text-4xl text-beige">H</span>
                    </div>
                  )}
                  <span className="absolute top-3 left-3 bg-brown/75 backdrop-blur-sm text-ivory text-[10px] tracking-[0.3em] uppercase px-3 py-1.5">
                    {ROOM_TYPE_UA[r.roomType] ?? r.roomType}
                  </span>
                  {(r.roomType === 'Deluxe' || r.roomType === 'Suite') && (
                    <span className="absolute top-3 right-3 bg-gold/90 text-ivory text-[10px] tracking-[0.2em] uppercase px-2.5 py-1">
                      Сніданок
                    </span>
                  )}
                </Link>

                {/* Info */}
                <div className="p-5 border-t border-beige">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-serif text-lg text-brown leading-none">Кімната №{r.roomNumber}</h3>
                    <div className="text-right">
                      <span className="font-serif text-lg text-gold">${r.price}</span>
                      <span className="text-xs text-brown-light">/ніч</span>
                    </div>
                  </div>
                  <p className="text-xs text-brown-light mb-4">{r.capacity} {r.capacity === 1 ? 'гість' : 'гостей'}</p>

                  <div className="flex gap-2">
                    <Link href={`/rooms/${r.roomId}?checkIn=${today}&checkOut=${tomorrow}`}
                      className="flex-1 text-center text-xs tracking-widest uppercase text-brown-mid border border-beige py-2.5 hover:border-gold hover:text-brown transition-all duration-300">
                      Детальніше
                    </Link>
                    <button onClick={() => remove(r.roomId)} disabled={removing === r.roomId}
                      className="px-4 py-2.5 border border-beige text-brown-light hover:border-red-300 hover:text-red-400 transition-all duration-300 disabled:opacity-40">
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
