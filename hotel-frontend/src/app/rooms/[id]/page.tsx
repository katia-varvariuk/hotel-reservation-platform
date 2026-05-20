'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import api from '@/lib/api'
import { Amenity, AvailableRoom, ReviewDto } from '@/lib/types'
import { ROOM_TYPE_UA } from '@/lib/constants'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import BookingModal from '@/components/BookingModal'


const ROOM_GALLERY: Record<number, Array<{ label: string; url: string }>> = {
  1: [
    { label: 'Ванна кімната', url: 'https://plus.unsplash.com/premium_photo-1674035037216-44af020955ad?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  ],
  2: [
    { label: 'Ванна кімната', url: 'https://images.unsplash.com/photo-1587527901949-ab0341697c1e?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  ],
  6: [
    { label: 'Ванна кімната', url: 'https://images.unsplash.com/photo-1629079447777-1e605162dc8d?q=80&w=1169&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
    { label: 'Зона відпочинку', url: 'https://images.unsplash.com/photo-1631049422186-4b0569fed517?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  ],
  7: [
    { label: 'Ванна кімната', url: 'https://images.unsplash.com/photo-1695002817411-203c7f19dfa3?q=80&w=1332&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
    { label: 'Зона відпочинку', url: 'https://images.unsplash.com/photo-1631049035486-58f342e9c6a9?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  ],
  3: [
    { label: 'Ванна кімната', url: 'https://images.unsplash.com/photo-1651951646668-46562cfb4518?q=80&w=1182&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  ],
  4: [
    { label: 'Ванна кімната', url: 'https://images.unsplash.com/photo-1564540579594-0930edb6de43?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  ],
  8: [
    { label: 'Ванна кімната', url: 'https://plus.unsplash.com/premium_photo-1661884424253-08db7c7758ce?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  ],
  9: [
    { label: 'Вітальня', url: 'https://images.unsplash.com/photo-1646974400439-321c4a9240b9?w=800&q=80&auto=format&fit=crop' },
    { label: 'Балкон / тераса', url: 'https://images.unsplash.com/photo-1591944438730-23dbc9076a9a?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
    { label: 'Ванна кімната', url: 'https://images.unsplash.com/photo-1572742482459-e04d6cfdd6f3?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  ],
  10: [
    { label: 'Робоча зона', url: 'https://images.unsplash.com/photo-1774280918099-599d2647621c?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
    { label: 'Ванна кімната', url: 'https://images.unsplash.com/photo-1634320611782-e7589d174453?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  ],
  5: [
    { label: 'Ванна кімната', url: 'https://plus.unsplash.com/premium_photo-1661963630748-3de7ab820570?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
    { label: 'Вітальня', url: 'https://images.unsplash.com/photo-1691936932068-e82aeea4f0ff?q=80&w=1193&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
    { label: 'Тераса', url: 'https://images.unsplash.com/photo-1657639753220-8d59b05958d1?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  ],
  11: [
    { label: 'Ванна кімната', url: 'https://images.unsplash.com/photo-1646974400439-8472d58bb19e?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
    { label: 'Вітальня', url: 'https://images.unsplash.com/photo-1713832139688-79676097edde?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  ],
  12: [
    { label: 'Спальня 2', url: 'https://plus.unsplash.com/premium_photo-1661877303180-19a028c21048?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
    { label: 'Ванна кімната', url: 'https://images.unsplash.com/photo-1765745518673-b562b7304a53?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
    { label: 'Ванна кімната 2', url: 'https://images.unsplash.com/photo-1705591882907-35324c0b592d?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
    { label: 'Кухня', url: 'https://images.unsplash.com/photo-1631049421483-bbcab9b66473?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
    { label: 'Вітальня', url: 'https://images.unsplash.com/photo-1772143535090-ede0b1d24a6c?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  ],
  13: [
    { label: 'Ванна кімната', url: 'https://images.unsplash.com/photo-1641870538417-c83e621d1425?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mzh8fG1vZGVybiUyMGhvdGVsJTIwYmF0aHJvb218ZW58MHx8MHx8fDA%3D' },
    { label: 'Тераса', url: 'https://images.unsplash.com/photo-1643913586401-c7c0b0f1b352?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
    { label: 'Вітальня', url: 'https://images.unsplash.com/photo-1756199638047-6d6930280e37?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  ],
  14: [
    { label: 'Ванна кімната', url: 'https://plus.unsplash.com/premium_photo-1675018083155-6742ba47d570?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
    { label: 'Вітальня', url: 'https://images.unsplash.com/photo-1600493505873-cddd69453072?q=80&w=1332&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  ],
  15: [
    { label: 'Ванна кімната', url: 'https://images.unsplash.com/photo-1744025098626-66c0b9cb1ba8?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
    { label: 'Вітальня', url: 'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87' },
  ],
}

const TYPE_GALLERY: Record<string, Array<{ label: string; url: string }>> = {
  Standard: [
    { label: 'Ванна кімната', url: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&q=80&auto=format&fit=crop' },
    { label: 'Зона відпочинку', url: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&q=80&auto=format&fit=crop' },
  ],
  Deluxe: [
    { label: 'Ванна кімната', url: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&q=80&auto=format&fit=crop' },
    { label: 'Балкон / тераса', url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80&auto=format&fit=crop' },
    { label: 'Вітальня', url: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&q=80&auto=format&fit=crop' },
  ],
  Suite: [
    { label: 'Ванна кімната', url: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&q=80&auto=format&fit=crop' },
    { label: 'Кухня', url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80&auto=format&fit=crop' },
    { label: 'Тераса', url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80&auto=format&fit=crop' },
    { label: 'Вітальня', url: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=800&q=80&auto=format&fit=crop' },
  ],
}

function Stars({ rating, interactive, onChange }: { rating: number; interactive?: boolean; onChange?: (n: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(n)}
          className={`text-lg leading-none ${n <= rating ? 'text-yellow-400' : 'text-slate-200'} ${interactive ? 'cursor-pointer hover:text-yellow-300' : 'cursor-default'}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

export default function RoomDetailPage() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, isClient } = useAuth()

  const checkIn = searchParams.get('checkIn') ?? new Date().toISOString().split('T')[0]
  const checkOut = searchParams.get('checkOut') ?? (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0] })()

  const [room, setRoom] = useState<AvailableRoom | null>(null)
  const [reviews, setReviews] = useState<ReviewDto[]>([])
  const [isFav, setIsFav] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showBooking, setShowBooking] = useState(false)

  const [amenities, setAmenities] = useState<Amenity[]>([])
  const [slideIndex, setSlideIndex] = useState(0)

  const [myReview, setMyReview] = useState<ReviewDto | null>(null)
  const [hasStayed, setHasStayed] = useState(false)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const [lightbox, setLightbox] = useState<{ slides: Array<{ url: string; label: string }>; index: number } | null>(null)

  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0

  useEffect(() => {
    if (!lightbox) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setLightbox(null); return }
      if (e.key === 'ArrowRight') setLightbox(lb => lb && { ...lb, index: (lb.index + 1) % lb.slides.length })
      if (e.key === 'ArrowLeft') setLightbox(lb => lb && { ...lb, index: (lb.index - 1 + lb.slides.length) % lb.slides.length })
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightbox])

  useEffect(() => {
    const roomId = parseInt(id)
    Promise.all([
      api.get<AvailableRoom[]>('/api/rooms/available', { params: { checkIn, checkOut } }),
      api.get<ReviewDto[]>(`/api/review/room/${roomId}`),
      isClient ? api.get<number[]>('/api/favorite') : Promise.resolve({ data: [] as number[] }),
      isClient ? api.get<boolean>(`/api/review/can-review/${roomId}`).catch(() => ({ data: false })) : Promise.resolve({ data: false }),
      api.get<Amenity[]>(`/api/amenities/room/${roomId}`).catch(() => ({ data: [] as Amenity[] })),
    ]).then(([roomsRes, reviewsRes, favRes, canReviewRes, amenitiesRes]) => {
      const found = roomsRes.data.find(r => r.roomId === roomId)
      if (!found) {
        api.get<AvailableRoom>(`/api/rooms/${roomId}`).then(r => setRoom({ ...r.data, isAvailable: false, calculatedPrice: null, nights: null }))
      } else {
        setRoom(found)
      }
      setReviews(reviewsRes.data)
      setIsFav((favRes.data as number[]).includes(roomId))
      setHasStayed(canReviewRes.data as boolean)
      setAmenities(amenitiesRes.data as Amenity[])
      if (user?.clientId) {
        const mine = reviewsRes.data.find(r => r.clientId === user.clientId)
        if (mine) { setMyReview(mine); setRating(mine.rating); setComment(mine.comment ?? '') }
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [id, checkIn, checkOut, isClient, user])

  const toggleFav = async () => {
    const roomId = parseInt(id)
    if (isFav) { await api.delete(`/api/favorite/${roomId}`) }
    else { await api.post(`/api/favorite/${roomId}`) }
    setIsFav(v => !v)
  }

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    setReviewError('')
    setSubmitting(true)
    try {
      if (myReview) {
        await api.put(`/api/review/${myReview.reviewId}`, { rating, comment })
        setMyReview(r => r ? { ...r, rating, comment } : r)
        setReviews(rs => rs.map(r => r.reviewId === myReview.reviewId ? { ...r, rating, comment } : r))
      } else {
        const res = await api.post<ReviewDto>('/api/review', { roomId: parseInt(id), rating, comment })
        const newReview = { ...res.data, clientName: user?.fullName ?? user?.email ?? '', avatarUrl: user?.avatarUrl ?? null }
        setMyReview(newReview)
        setReviews(rs => [newReview, ...rs])
      }
    } catch {
      setReviewError('Не вдалося зберегти відгук')
    } finally {
      setSubmitting(false)
    }
  }

  const deleteReview = async () => {
    if (!myReview) return
    await api.delete(`/api/review/${myReview.reviewId}`)
    setReviews(rs => rs.filter(r => r.reviewId !== myReview.reviewId))
    setMyReview(null)
    setRating(5)
    setComment('')
  }

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
      <div className="h-4 bg-beige rounded w-32 animate-pulse" />
      <div className="bg-ivory rounded-2xl border border-beige-light overflow-hidden animate-pulse">
        <div className="h-80 bg-beige" />
        <div className="p-6 space-y-3">
          <div className="h-6 bg-beige rounded w-1/3" />
          <div className="h-4 bg-beige rounded w-full" />
        </div>
      </div>
    </div>
  )

  if (!room) return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-center text-brown-light">
      <p>Номер не знайдено</p>
      <button onClick={() => router.back()} className="mt-4 text-gold-dark text-sm hover:underline">← Назад</button>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">
      <button onClick={() => router.back()} className="text-xs tracking-[0.3em] uppercase text-brown-light hover:text-brown flex items-center gap-2 transition-colors">
        <svg viewBox="0 0 20 20" className="w-4 h-4 fill-current"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 0 1-1.414 0l-6-6a1 1 0 0 1 0-1.414l6-6a1 1 0 0 1 1.414 1.414L5.414 9H17a1 1 0 1 1 0 2H5.414l4.293 4.293a1 1 0 0 1 0 1.414z" clipRule="evenodd"/></svg>
        Назад до списку
      </button>

      <div className="bg-ivory border border-beige overflow-hidden">
        {/* Photo slider */}
        {(() => {
          const gallery = ROOM_GALLERY[room.roomId] ?? TYPE_GALLERY[room.roomType] ?? TYPE_GALLERY.Standard
          const mainPhoto = room.photoUrl || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=80&auto=format&fit=crop'
          const slides = [
            { label: 'Спальня', url: mainPhoto },
            ...gallery,
          ]
          const total = slides.length
          const prev = () => setSlideIndex(i => (i - 1 + total) % total)
          const next = () => setSlideIndex(i => (i + 1) % total)
          const cur = slides[slideIndex]
          return (
            <div className="relative h-96 overflow-hidden select-none">
              <img
                key={slideIndex}
                src={cur.url}
                alt={cur.label}
                onClick={() => setLightbox({ slides, index: slideIndex })}
                className="w-full h-full object-cover transition-opacity duration-300 cursor-zoom-in"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

              {/* badges */}
              <div className="absolute bottom-5 left-5 flex flex-col gap-1.5 pointer-events-none">
                <span className="bg-brown/80 backdrop-blur-sm text-ivory text-[10px] tracking-[0.3em] uppercase px-3 py-1.5 inline-block">
                  {ROOM_TYPE_UA[room.roomType] ?? room.roomType}
                </span>
                {(room.roomType === 'Deluxe' || room.roomType === 'Suite') && (
                  <span className="bg-gold/90 text-ivory text-[10px] tracking-[0.2em] uppercase px-3 py-1.5 inline-block">
                    Сніданок включено
                  </span>
                )}
                {room.status !== 'Available' && (
                  <span className="bg-orange-600/80 text-white text-[10px] tracking-[0.2em] uppercase px-3 py-1.5 inline-block">
                    На обслуговуванні
                  </span>
                )}
              </div>

              {/* slide label */}
              <div className="absolute bottom-5 right-5 pointer-events-none">
                <span className="text-white/70 text-[10px] tracking-[0.25em] uppercase">{cur.label}</span>
              </div>

              {/* prev / next */}
              {total > 1 && (
                <>
                  <button onClick={prev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/30 hover:bg-black/50 backdrop-blur-sm flex items-center justify-center transition-colors">
                    <svg viewBox="0 0 20 20" className="w-4 h-4 fill-white"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 0 1 0 1.414L9.414 10l3.293 3.293a1 1 0 0 1-1.414 1.414l-4-4a1 1 0 0 1 0-1.414l4-4a1 1 0 0 1 1.414 0z" clipRule="evenodd"/></svg>
                  </button>
                  <button onClick={next}
                    className="absolute right-14 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/30 hover:bg-black/50 backdrop-blur-sm flex items-center justify-center transition-colors">
                    <svg viewBox="0 0 20 20" className="w-4 h-4 fill-white"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 0 1 0-1.414L10.586 10 7.293 6.707a1 1 0 0 1 1.414-1.414l4 4a1 1 0 0 1 0 1.414l-4 4a1 1 0 0 1-1.414 0z" clipRule="evenodd"/></svg>
                  </button>
                </>
              )}

              {/* dots */}
              {total > 1 && (
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {slides.map((_, i) => (
                    <button key={i} onClick={() => setSlideIndex(i)}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${i === slideIndex ? 'bg-white w-4' : 'bg-white/50'}`}
                    />
                  ))}
                </div>
              )}

              {/* Fav button */}
              {isClient && (
                <button onClick={toggleFav}
                  className="absolute top-4 right-4 w-9 h-9 bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-sm">
                  <svg viewBox="0 0 24 24" className={`w-4.5 h-4.5 ${isFav ? 'fill-gold stroke-gold' : 'fill-none stroke-brown-mid'}`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </button>
              )}
            </div>
          )
        })()}

        <div className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-gold text-[10px] tracking-[0.4em] uppercase mb-2">{ROOM_TYPE_UA[room.roomType] ?? room.roomType}</p>
              <h1 className="font-serif text-3xl text-brown mb-2">Кімната №{room.roomNumber}</h1>
              {avgRating > 0 && (
                <div className="flex items-center gap-2">
                  <Stars rating={Math.round(avgRating)} />
                  <span className="text-xs text-brown-light">{avgRating.toFixed(1)} · {reviews.length} відгуків</span>
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="font-serif text-3xl text-gold">${room.price}</div>
              <div className="text-xs text-brown-light tracking-wide">за ніч</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-px bg-beige mb-6">
            {[
              { label: 'Гостей', value: `${room.capacity} ${room.capacity === 1 ? 'особа' : 'особи'}` },
              { label: 'Заїзд', value: new Date(checkIn).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' }) },
              { label: 'Виїзд', value: new Date(checkOut).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' }) },
            ].map(item => (
              <div key={item.label} className="bg-cream px-4 py-3">
                <p className="text-[10px] tracking-[0.25em] uppercase text-brown-light mb-0.5">{item.label}</p>
                <p className="text-sm font-medium text-brown">{item.value}</p>
              </div>
            ))}
          </div>

          {room.calculatedPrice && room.nights && (
            <div className="flex items-center justify-between bg-gold/5 border border-gold/20 px-5 py-3 mb-6">
              <span className="text-xs tracking-[0.25em] uppercase text-brown-light">Разом за {room.nights} {room.nights === 1 ? 'ніч' : 'ночей'}</span>
              <span className="font-serif text-xl text-gold">${room.calculatedPrice.toFixed(2)}</span>
            </div>
          )}

          {room.description && (
            <p className="text-brown-mid text-sm leading-relaxed mb-6">{room.description}</p>
          )}

          {amenities.length > 0 && (
            <div className="mb-6">
              <p className="text-[10px] tracking-[0.35em] uppercase text-brown-light mb-3">Зручності</p>
              <div className="flex flex-wrap gap-2">
                {amenities.map(a => (
                  <span key={a.amenityId} className="flex items-center gap-1.5 bg-cream border border-beige px-3 py-1.5 text-xs text-brown-mid">
                    <span>{a.icon}</span>
                    <span>{a.name}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {room.isAvailable && isClient && (
            <button onClick={() => setShowBooking(true)}
              className="bg-brown text-ivory px-8 py-3 text-xs tracking-[0.3em] uppercase hover:bg-gold transition-colors duration-300">
              Забронювати
            </button>
          )}
          {!isClient && room.isAvailable && (
            <button onClick={() => router.push('/auth/login')}
              className="bg-brown text-ivory px-8 py-3 text-xs tracking-[0.3em] uppercase hover:bg-gold transition-colors duration-300">
              Увійти щоб забронювати
            </button>
          )}
        </div>
      </div>

      <div className="bg-ivory border border-beige p-8">
        <div className="flex items-baseline gap-4 mb-6">
          <h2 className="font-serif text-2xl text-brown">Відгуки</h2>
          {reviews.length > 0 && <span className="text-sm text-brown-light">{reviews.length} відгуків</span>}
        </div>

        {isClient && (hasStayed || myReview) && (
          <form onSubmit={submitReview} className="border border-beige p-5 mb-7 bg-cream">
            <p className="text-sm font-semibold text-brown-mid mb-3">{myReview ? 'Ваш відгук' : 'Залишити відгук'}</p>
            <Stars rating={rating} interactive onChange={setRating} />
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Коментар (необов'язково)"
              rows={3}
              className="w-full mt-3 border border-beige rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent resize-none"
            />
            {reviewError && <p className="text-red-500 text-xs mt-1">{reviewError}</p>}
            <div className="flex gap-2 mt-3">
              <button type="submit" disabled={submitting}
                className="bg-gold text-white px-5 py-1.5 rounded-lg text-sm font-medium hover:bg-gold-dark disabled:opacity-50 transition-colors">
                {submitting ? '...' : myReview ? 'Оновити' : 'Надіслати'}
              </button>
              {myReview && (
                <button type="button" onClick={deleteReview}
                  className="text-red-500 hover:text-red-700 text-sm font-medium px-4 py-1.5 transition-colors">
                  Видалити
                </button>
              )}
            </div>
          </form>
        )}
        {isClient && !hasStayed && !myReview && (
          <p className="text-xs text-brown-light italic mb-5">Відгук можна залишити лише після виселення з цього номеру.</p>
        )}

        {reviews.length === 0 ? (
          <p className="text-brown-light text-sm">Поки немає відгуків</p>
        ) : (
          <div className="space-y-4">
            {reviews.map(r => (
              <div key={r.reviewId} className="border-b border-beige-light pb-4 last:border-0 last:pb-0">
                <div className="flex items-center gap-3 mb-1.5">
                  <div className="w-8 h-8 rounded-full bg-cream border border-beige-light flex items-center justify-center text-sm font-semibold text-gold-dark overflow-hidden shrink-0">
                    {r.avatarUrl ? <img src={r.avatarUrl} alt="" className="w-full h-full object-cover" /> : (r.clientName?.[0]?.toUpperCase() ?? '?')}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-brown">{r.clientName ?? 'Клієнт'}</p>
                    <p className="text-xs text-brown-light">{new Date(r.createdAt).toLocaleDateString('uk-UA')}</p>
                  </div>
                  <div className="ml-auto"><Stars rating={r.rating} /></div>
                </div>
                {r.comment && <p className="text-sm text-brown-mid ml-11 leading-relaxed">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {showBooking && room && (
        <BookingModal
          room={room}
          checkIn={checkIn}
          checkOut={checkOut}
          onClose={() => setShowBooking(false)}
          onSuccess={() => { setShowBooking(false); router.push('/bookings') }}
        />
      )}

      {lightbox && (() => {
        const cur = lightbox.slides[lightbox.index]
        const total = lightbox.slides.length
        const goPrev = (e: React.MouseEvent) => { e.stopPropagation(); setLightbox(lb => lb && { ...lb, index: (lb.index - 1 + total) % total }) }
        const goNext = (e: React.MouseEvent) => { e.stopPropagation(); setLightbox(lb => lb && { ...lb, index: (lb.index + 1) % total }) }
        return (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            onClick={() => setLightbox(null)}
          >
            <button onClick={e => { e.stopPropagation(); setLightbox(null) }}
              className="absolute top-5 right-5 w-10 h-10 bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-white" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>

            {total > 1 && (
              <button onClick={goPrev}
                className="absolute left-5 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                <svg viewBox="0 0 20 20" className="w-5 h-5 fill-white"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 0 1 0 1.414L9.414 10l3.293 3.293a1 1 0 0 1-1.414 1.414l-4-4a1 1 0 0 1 0-1.414l4-4a1 1 0 0 1 1.414 0z" clipRule="evenodd"/></svg>
              </button>
            )}

            <img
              src={cur.url}
              alt={cur.label}
              onClick={e => e.stopPropagation()}
              className="max-w-[90vw] max-h-[90vh] object-contain"
            />

            {total > 1 && (
              <button onClick={goNext}
                className="absolute right-5 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                <svg viewBox="0 0 20 20" className="w-5 h-5 fill-white"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 0 1 0-1.414L10.586 10 7.293 6.707a1 1 0 0 1 1.414-1.414l4 4a1 1 0 0 1 0 1.414l-4 4a1 1 0 0 1-1.414 0z" clipRule="evenodd"/></svg>
              </button>
            )}

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
              <span className="text-white/60 text-xs tracking-widest uppercase">{cur.label}</span>
              {total > 1 && (
                <div className="flex gap-1.5">
                  {lightbox.slides.map((_, i) => (
                    <button key={i} onClick={e => { e.stopPropagation(); setLightbox(lb => lb && { ...lb, index: i }) }}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${i === lightbox.index ? 'bg-white w-4' : 'bg-white/40'}`} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
