'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { AvailableRoom, ReviewDto } from '@/lib/types'
import { useAuth } from '@/context/AuthContext'
import BookingModal from '@/components/BookingModal'

const today = () => new Date().toISOString().split('T')[0]
const tomorrow = () => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0] }

const ROOM_TYPE_UA: Record<string, string> = { Standard: 'Стандарт', Deluxe: 'Делюкс', Suite: 'Сюїт' }

const AMENITIES = [
  {
    title: 'Басейн', desc: 'Відкритий інфініті-басейн з панорамним видом',
    svg: <path d="M2 20c2-1 4-1 6 0s4 1 6 0 4-1 6 0M2 15c2-1 4-1 6 0s4 1 6 0 4-1 6 0M12 3a3 3 0 0 1 3 3c0 2-1.5 3-3 4C10.5 9 9 8 9 6a3 3 0 0 1 3-3z" />,
  },
  {
    title: 'SPA & Велнес', desc: 'Кабінети масажу, сауна та аромапроцедури',
    svg: <path d="M12 22c6 0 10-4 10-10a10 10 0 0 0-10-10C6 2 2 6 2 12c0 6 4 10 10 10zM12 8c0 2-1 3.5-2 4.5m2-4.5c0 2 1 3.5 2 4.5M12 8v9" />,
  },
  {
    title: 'Ресторан', desc: 'Авторська кухня, вина та живі вечори',
    svg: <><path d="M3 11l19-9-9 19-2-8-8-2z"/></>,
  },
  {
    title: 'Фітнес-центр', desc: 'Сучасне обладнання 24/7',
    svg: <path d="M6.5 6.5h11M6.5 12h11M6.5 17.5h11M3 6.5h.5M3 12h.5M3 17.5h.5M20 6.5h.5M20 12h.5M20 17.5h.5" />,
  },
  {
    title: 'Сніданок', desc: 'Шведський стіл щодня з 7:00 до 11:00',
    svg: <><circle cx="12" cy="12" r="9"/><path d="M8 12h8M12 8v8"/></>,
  },
  {
    title: 'Room Service', desc: 'Персональне обслуговування 24/7',
    svg: <><path d="M3 12h18M12 3v3m0 12v3M4.22 4.22l2.12 2.12m11.32 11.32 2.12 2.12M4.22 19.78l2.12-2.12m11.32-11.32 2.12-2.12"/></>,
  },
]

const TESTIMONIALS_FALLBACK = [
  { name: 'Оксана К.', city: 'Київ', rating: 5, text: 'Неймовірний досвід! Персонал завжди уважний, номер перевершив усі очікування. Обов\'язково повернусь.' },
  { name: 'Михайло Р.', city: 'Львів', rating: 5, text: 'Ідеальне місце для відпочинку. SPA — просто казка, а шведський стіл дарує нові смакові відчуття щоранку.' },
  { name: 'Анна С.', city: 'Одеса', rating: 5, text: 'Зупинялась у сюїті — це щось неймовірне. Тиша, краса, бездоганний сервіс. Рекомендую всім!' },
]

export default function HomePage() {
  const { isLoading, isClient, isAdmin, user } = useAuth()
  const [rooms, setRooms] = useState<AvailableRoom[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [checkIn, setCheckIn] = useState(today())
  const [checkOut, setCheckOut] = useState(tomorrow())
  const [roomType, setRoomType] = useState('')
  const [minCapacity, setMinCapacity] = useState('')

  const [selected, setSelected] = useState<AvailableRoom | null>(null)
  const [toast, setToast] = useState('')
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set())

  const [reviews, setReviews] = useState<ReviewDto[]>([])

  useEffect(() => {
    api.get<ReviewDto[]>('/api/review/latest?count=3').then(r => setReviews(r.data)).catch(() => {})
  }, [])

  const deleteReview = async (id: number) => {
    if (!confirm('Видалити відгук?')) return
    await api.delete(`/api/review/${id}`)
    setReviews(rs => rs.filter(r => r.reviewId !== id))
  }

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 5000) }

  const search = useCallback(async (scroll = false) => {
    setLoading(true); setError('')
    try {
      const params: Record<string, string> = { checkIn, checkOut }
      if (roomType) params.roomType = roomType
      if (minCapacity) params.minCapacity = minCapacity
      const res = await api.get<AvailableRoom[]>('/api/rooms/available', { params })
      setRooms(res.data)
      if (scroll) setTimeout(() => document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    } catch { setError('Не вдалося завантажити номери') }
    finally { setLoading(false) }
  }, [checkIn, checkOut, roomType, minCapacity])

  useEffect(() => {
    if (isClient) {
      api.get<number[]>('/api/favorite').then(r => setFavoriteIds(new Set(r.data))).catch(() => {})
    }
  }, [isClient])

  useEffect(() => { if (!isLoading) search(false) }, [isLoading, search])

  const toggleFav = async (roomId: number) => {
    const next = new Set(favoriteIds)
    if (next.has(roomId)) { next.delete(roomId); await api.delete(`/api/favorite/${roomId}`) }
    else { next.add(roomId); await api.post(`/api/favorite/${roomId}`) }
    setFavoriteIds(next)
  }

  const inputCls = "w-full bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder-white/50 px-4 py-3 text-sm focus:outline-none focus:border-gold/70 transition-colors"
  const labelCls = "block text-[10px] tracking-[0.3em] uppercase text-white/60 mb-1.5"

  return (
    <>
      {/* ═══════════════ HERO ═══════════════ */}
      <section className="-mt-20 relative h-screen flex flex-col justify-end">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-brown via-brown-mid to-graphite">
          <img
            src="https://images.unsplash.com/photo-1566073771259-9cc1f9cda539?w=1920&q=80&auto=format&fit=crop"
            alt="Luxury hotel"
            className="w-full h-full object-cover opacity-60"
            onError={e => (e.currentTarget.style.display = 'none')}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-graphite/80 via-brown/30 to-transparent" />
        </div>

        {/* Hero text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pb-52 text-center px-4">
          <p className="text-gold tracking-[0.6em] uppercase text-xs mb-6 font-light">Premium Hotel Experience</p>
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-white mb-5 leading-[1.05] tracking-wide">
            Відчуйте<br /><em className="not-italic text-gold-light">розкіш</em>
          </h1>
          <p className="text-white/65 text-base md:text-lg max-w-lg leading-relaxed font-light">
            Вишуканий комфорт, бездоганний сервіс та атмосфера справжньої розкоші
          </p>
          <div className="flex gap-4 mt-8">
            <a href="#rooms"
              className="px-8 py-3 bg-gold text-ivory text-sm tracking-widest uppercase hover:bg-gold-dark transition-colors duration-300">
              Обрати номер
            </a>
            <a href="#amenities"
              className="px-8 py-3 border border-white/40 text-white text-sm tracking-widest uppercase hover:bg-white/10 transition-colors duration-300">
              Про готель
            </a>
          </div>
        </div>

        {/* Booking widget */}
        <div className="relative z-10 pb-12 px-4">
          <div className="max-w-4xl mx-auto bg-graphite/40 backdrop-blur-lg border border-white/10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10 p-px">
              <div className="bg-graphite/30 p-4">
                <label className={labelCls}>Заїзд</label>
                <input type="date" value={checkIn} min={today()} onChange={e => setCheckIn(e.target.value)} className={inputCls} />
              </div>
              <div className="bg-graphite/30 p-4">
                <label className={labelCls}>Виїзд</label>
                <input type="date" value={checkOut} min={checkIn} onChange={e => setCheckOut(e.target.value)} className={inputCls} />
              </div>
              <div className="bg-graphite/30 p-4">
                <label className={labelCls}>Тип номера</label>
                <select value={roomType} onChange={e => setRoomType(e.target.value)} className={inputCls + ' cursor-pointer'}>
                  <option value="" className="bg-brown text-white">Будь-який</option>
                  <option value="Standard" className="bg-brown text-white">Стандарт</option>
                  <option value="Deluxe" className="bg-brown text-white">Делюкс</option>
                  <option value="Suite" className="bg-brown text-white">Сюїт</option>
                </select>
              </div>
              <div className="bg-graphite/30 p-4">
                <label className={labelCls}>Гостей (мін.)</label>
                <input type="number" value={minCapacity} min={1} placeholder="Будь-яка" onChange={e => setMinCapacity(e.target.value)} className={inputCls} />
              </div>
            </div>
            <button onClick={() => search(true)} disabled={loading}
              className="w-full bg-gold hover:bg-gold-dark text-ivory py-4 text-xs tracking-[0.4em] uppercase font-medium transition-colors duration-300 disabled:opacity-50">
              {loading ? 'Пошук...' : 'Знайти номери'}
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════ STATS ═══════════════ */}
      <section className="bg-cream border-b border-beige/50">
        <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '15+', label: 'Видів номерів' },
            { value: '4.9★', label: 'Середня оцінка' },
            { value: '1200+', label: 'Гостей щороку' },
            { value: '24/7', label: 'Сервіс' },
          ].map(s => (
            <div key={s.label}>
              <div className="font-serif text-3xl text-gold mb-1">{s.value}</div>
              <div className="text-xs tracking-widest uppercase text-brown-light">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════ AMENITIES ═══════════════ */}
      <section id="amenities" className="py-28 px-6 bg-warm-white">
        <div className="max-w-7xl mx-auto">
          <SectionHeader eyebrow="Наш готель" title="Все для вашого комфорту" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mt-16">
            {AMENITIES.map(a => (
              <div key={a.title} className="group text-center">
                <div className="w-14 h-14 mx-auto mb-4 border border-beige group-hover:border-gold transition-colors duration-300 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-gold-dark fill-none group-hover:stroke-gold transition-colors duration-300" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    {a.svg}
                  </svg>
                </div>
                <h3 className="font-serif text-sm text-brown mb-1">{a.title}</h3>
                <p className="text-xs text-brown-light leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ ROOMS ═══════════════ */}
      <section id="rooms" className="py-28 px-6 bg-cream/40">
        <div className="max-w-7xl mx-auto">
          <SectionHeader eyebrow="Наші номери" title={rooms.length ? `Доступно ${rooms.length} варіантів` : 'Оберіть номер'} />
          {error && <p className="text-center text-sm text-red-500 mt-4">{error}</p>}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-14">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-60 bg-beige/40" />
                  <div className="p-5 space-y-2.5">
                    <div className="h-4 bg-beige/40 rounded w-1/2" />
                    <div className="h-3 bg-beige/40 rounded w-full" />
                    <div className="h-3 bg-beige/40 rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-20">
              <div className="font-serif text-6xl text-beige mb-4">🏨</div>
              <p className="font-serif text-xl text-brown-mid">Номерів на ці дати не знайдено</p>
              <p className="text-sm text-brown-light mt-2">Спробуйте змінити дати або тип номера</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-14">
              {rooms.map(room => (
                <LuxuryRoomCard key={room.roomId} room={room} onBook={() => setSelected(room)}
                  checkIn={checkIn} checkOut={checkOut} favoriteIds={favoriteIds} onToggleFav={toggleFav} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════ SPA ═══════════════ */}
      <section className="py-0 bg-warm-white overflow-hidden">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2">
          <div className="relative h-80 md:h-auto">
            <div className="absolute inset-0 bg-sage/20">
              <img
                src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&q=80&auto=format&fit=crop"
                alt="SPA"
                className="w-full h-full object-cover"
                onError={e => (e.currentTarget.style.display = 'none')}
              />
            </div>
          </div>
          <div className="flex flex-col justify-center px-12 py-20 bg-cream">
            <p className="text-gold tracking-[0.4em] uppercase text-xs mb-5">Релаксація та відновлення</p>
            <h2 className="font-serif text-4xl md:text-5xl text-brown mb-6 leading-tight">SPA &<br />Велнес-центр</h2>
            <p className="text-brown-mid leading-relaxed mb-4">
              Поринь у світ спокою в нашому преміальному велнес-центрі. Авторські масажні програми, ароматерапія, хаммам та сауна для вашого повного відновлення.
            </p>
            <p className="text-brown-light text-sm leading-relaxed mb-8">
              Наші майстри допоможуть відновити енергію та гармонію тіла і розуму.
            </p>
            <div className="flex flex-col gap-3 text-sm text-brown-mid">
              <span className="flex items-center gap-3"><span className="w-1 h-1 bg-gold rounded-full" />Масаж та аромапроцедури</span>
              <span className="flex items-center gap-3"><span className="w-1 h-1 bg-gold rounded-full" />Фінська сауна та хаммам</span>
              <span className="flex items-center gap-3"><span className="w-1 h-1 bg-gold rounded-full" />Косметологічні процедури</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ RESTAURANT ═══════════════ */}
      <section className="py-0 bg-warm-white overflow-hidden">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2">
          <div className="flex flex-col justify-center px-12 py-20 order-2 md:order-1">
            <p className="text-gold tracking-[0.4em] uppercase text-xs mb-5">Гастрономія</p>
            <h2 className="font-serif text-4xl md:text-5xl text-brown mb-6 leading-tight">Ресторан<br />&amp; Бранч</h2>
            <p className="text-brown-mid leading-relaxed mb-4">
              Авторська кухня шефа з відбором найсвіжіших локальних інгредієнтів. Вишукане меню, розкішна сервіровка та увага до кожної деталі.
            </p>
            <p className="text-brown-light text-sm leading-relaxed mb-8">
              Щодня з 7:00 — Шведський стіл. Обід та вечеря — à la carte. Вечори п'ятниці та суботи — живі виступи.
            </p>
            <div className="flex flex-col gap-3 text-sm text-brown-mid">
              <span className="flex items-center gap-3"><span className="w-1 h-1 bg-gold rounded-full" />Авторська та класична кухня</span>
              <span className="flex items-center gap-3"><span className="w-1 h-1 bg-gold rounded-full" />Добірка вин та крафтових напоїв</span>
              <span className="flex items-center gap-3"><span className="w-1 h-1 bg-gold rounded-full" />Приватний банкетний зал</span>
            </div>
          </div>
          <div className="relative h-80 md:h-auto order-1 md:order-2">
            <div className="absolute inset-0 bg-brown/20">
              <img
                src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80&auto=format&fit=crop"
                alt="Restaurant"
                className="w-full h-full object-cover"
                onError={e => (e.currentTarget.style.display = 'none')}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ TESTIMONIALS ═══════════════ */}
      <section className="py-28 px-6 bg-brown">
        <div className="max-w-6xl mx-auto">
          <SectionHeader eyebrow="Відгуки гостей" title="Що кажуть наші гості" light />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-14">
            {(reviews.length > 0 ? reviews : TESTIMONIALS_FALLBACK).map((t, idx) => {
              const isReal = reviews.length > 0
              const r = t as ReviewDto
              const fb = t as typeof TESTIMONIALS_FALLBACK[0]
              const name = isReal ? (r.clientName ?? '?') : fb.name
              const rating = isReal ? r.rating : fb.rating
              const text = isReal ? (r.comment ?? '') : fb.text
              const sub = isReal ? (r.roomNumber ? `Кімната ${r.roomNumber}` : '') : fb.city
              return (
                <div key={isReal ? r.reviewId : idx} className="border border-white/10 p-8 relative">
                  {isAdmin && isReal && (
                    <button onClick={() => deleteReview(r.reviewId)}
                      className="absolute top-3 right-3 text-white/30 hover:text-red-400 text-xs transition-colors"
                      title="Видалити відгук">✕</button>
                  )}
                  <div className="flex gap-0.5 mb-5">
                    {[...Array(rating)].map((_, i) => (
                      <svg key={i} viewBox="0 0 20 20" className="w-3.5 h-3.5 fill-gold"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292z"/></svg>
                    ))}
                  </div>
                  <p className="text-white/75 text-sm leading-relaxed mb-6 font-light italic">&ldquo;{text}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gold/20 border border-gold/30 flex items-center justify-center overflow-hidden">
                      {isReal && r.avatarUrl
                        ? <img src={r.avatarUrl} alt="" className="w-full h-full object-cover" />
                        : <span className="font-serif text-gold text-sm">{name[0]?.toUpperCase()}</span>
                      }
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{name}</p>
                      {sub && <p className="text-white/40 text-xs">{sub}</p>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <SiteFooter />

      {/* Booking modal */}
      {selected && (
        <BookingModal room={selected} checkIn={checkIn} checkOut={checkOut}
          onClose={() => setSelected(null)}
          onSuccess={() => { setSelected(null); search(); showToast('Бронювання прийнято! Очікуйте підтвердження від адміністратора.') }} />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-brown text-ivory text-sm px-7 py-4 shadow-xl flex items-center gap-3 max-w-md">
          <svg viewBox="0 0 20 20" className="w-4 h-4 fill-gold shrink-0"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm3.707-9.293a1 1 0 0 0-1.414-1.414L9 10.586 7.707 9.293a1 1 0 0 0-1.414 1.414l2 2a1 1 0 0 0 1.414 0l4-4z" clipRule="evenodd"/></svg>
          <span>{toast}</span>
          <button onClick={() => setToast('')} className="ml-2 text-ivory/50 hover:text-ivory">&times;</button>
        </div>
      )}
    </>
  )
}

/* ═══════════════ ROOM CARD ═══════════════ */
function LuxuryRoomCard({ room, onBook, checkIn, checkOut, favoriteIds, onToggleFav }: {
  room: AvailableRoom; onBook: () => void; checkIn: string; checkOut: string
  favoriteIds: Set<number>; onToggleFav: (id: number) => void
}) {
  const { user, isClient } = useAuth()
  const isFav = favoriteIds.has(room.roomId)

  return (
    <div className="group bg-ivory overflow-hidden hover:shadow-2xl transition-all duration-500">
      {/* Image */}
      <div className="relative overflow-hidden">
        <Link href={`/rooms/${room.roomId}?checkIn=${checkIn}&checkOut=${checkOut}`}>
          {room.photoUrl ? (
            <img src={room.photoUrl} alt={`Кімната ${room.roomNumber}`}
              className="w-full h-60 object-cover group-hover:scale-105 transition-transform duration-700" />
          ) : (
            <div className="w-full h-60 bg-beige/30 flex items-center justify-center">
              <span className="font-serif text-5xl text-beige">H</span>
            </div>
          )}
        </Link>
        <div className="absolute top-4 left-4 flex flex-col gap-1.5">
          <span className="bg-brown/75 backdrop-blur-sm text-ivory text-[10px] tracking-[0.3em] uppercase px-3 py-1.5">
            {ROOM_TYPE_UA[room.roomType] ?? room.roomType}
          </span>
          {(room.roomType === 'Deluxe' || room.roomType === 'Suite') && (
            <span className="bg-gold/90 backdrop-blur-sm text-ivory text-[10px] tracking-[0.2em] uppercase px-3 py-1.5">
              Сніданок включено
            </span>
          )}
        </div>
        {isClient && (
          <button onClick={() => onToggleFav(room.roomId)}
            className="absolute top-4 right-4 w-8 h-8 bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors">
            <svg viewBox="0 0 24 24" className={`w-4 h-4 transition-colors ${isFav ? 'fill-gold stroke-gold' : 'fill-none stroke-brown-mid'}`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-5 border border-beige/40 border-t-0">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-serif text-lg text-brown leading-none">Кімната №{room.roomNumber}</h3>
          <div className="text-right">
            <span className="font-serif text-lg text-gold">${room.price}</span>
            <span className="text-xs text-brown-light">/ніч</span>
          </div>
        </div>

        {room.averageRating ? (
          <div className="flex items-center gap-1 mb-3">
            {[...Array(Math.round(room.averageRating))].map((_, i) => (
              <svg key={i} viewBox="0 0 20 20" className="w-3 h-3 fill-gold"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292z"/></svg>
            ))}
            <span className="text-xs text-brown-light ml-1">{room.averageRating.toFixed(1)}</span>
          </div>
        ) : <div className="mb-3" />}

        {room.description && (
          <p className="text-xs text-brown-light leading-relaxed line-clamp-2 mb-4">{room.description}</p>
        )}

        <div className="flex items-center gap-3 text-xs text-brown-light mb-4">
          <span>{room.capacity} {room.capacity === 1 ? 'гість' : 'гостей'}</span>
          {room.nights && <span className="text-beige">·</span>}
          {room.nights && <span>{room.nights} ночей</span>}
          {room.calculatedPrice && <><span className="text-beige">·</span><span className="text-gold font-medium">${room.calculatedPrice.toFixed(0)}</span></>}
        </div>

        <div className="flex gap-2">
          <Link href={`/rooms/${room.roomId}?checkIn=${checkIn}&checkOut=${checkOut}`}
            className="flex-1 text-center text-xs tracking-widest uppercase text-brown-mid border border-beige py-2.5 hover:border-gold hover:text-brown transition-all duration-300">
            Детальніше
          </Link>
          <button onClick={onBook} disabled={!user}
            className="flex-1 text-xs tracking-widest uppercase bg-brown text-ivory py-2.5 hover:bg-gold transition-colors duration-300 disabled:opacity-30">
            {user ? 'Забронювати' : 'Увійти'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════ HELPERS ═══════════════ */
function SectionHeader({ eyebrow, title, light }: { eyebrow: string; title: string; light?: boolean }) {
  return (
    <div className="text-center">
      <p className={`tracking-[0.5em] uppercase text-xs mb-4 ${light ? 'text-gold/80' : 'text-gold'}`}>{eyebrow}</p>
      <h2 className={`font-serif text-4xl md:text-5xl ${light ? 'text-white' : 'text-brown'}`}>{title}</h2>
      <div className="flex items-center justify-center gap-4 mt-5">
        <span className={`h-px w-16 ${light ? 'bg-white/20' : 'bg-beige'}`} />
        <span className="w-1.5 h-1.5 bg-gold rotate-45 shrink-0" />
        <span className={`h-px w-16 ${light ? 'bg-white/20' : 'bg-beige'}`} />
      </div>
    </div>
  )
}

function SiteFooter() {
  return (
    <footer className="bg-graphite text-white/60 py-16 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <div className="flex flex-col leading-none gap-1 mb-5">
            <span className="font-serif text-2xl tracking-wider text-white">ARIA</span>
            <span className="text-[10px] tracking-[0.45em] uppercase text-gold">Hotel</span>
          </div>
          <p className="text-sm leading-relaxed max-w-xs">
            Преміальний готель з незабутньою атмосферою розкоші та бездоганним сервісом у серці міста.
          </p>
        </div>
        <div>
          <h4 className="text-white text-xs tracking-[0.3em] uppercase mb-5">Навігація</h4>
          <div className="flex flex-col gap-3 text-sm">
            <Link href="/" className="hover:text-gold transition-colors">Номери</Link>
            <Link href="/services" className="hover:text-gold transition-colors">Послуги та ціни</Link>
            <Link href="/bookings" className="hover:text-gold transition-colors">Мої бронювання</Link>
            <Link href="/profile" className="hover:text-gold transition-colors">Профіль</Link>
          </div>
        </div>
        <div>
          <h4 className="text-white text-xs tracking-[0.3em] uppercase mb-5">Контакти</h4>
          <div className="flex flex-col gap-3 text-sm">
            <span>+380 44 123 45 67</span>
            <span>info@hotelsystem.ua</span>
            <span>вул. Хрещатик, 1, Київ</span>
            <div className="flex gap-3 mt-2">
              <span className="w-8 h-8 border border-white/20 flex items-center justify-center hover:border-gold cursor-pointer transition-colors text-xs">IG</span>
              <span className="w-8 h-8 border border-white/20 flex items-center justify-center hover:border-gold cursor-pointer transition-colors text-xs">FB</span>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/10 text-xs text-center text-white/30">
        © {new Date().getFullYear()} ARIA Hotel. Всі права захищені.
      </div>
    </footer>
  )
}
