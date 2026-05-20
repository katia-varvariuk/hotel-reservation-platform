'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { AvailableRoom, Reservation } from '@/lib/types'
import { ROOM_TYPE_UA, TIER_LABELS } from '@/lib/constants'

interface ClientProfile {
  clientId: number
  fullName: string
  passportData: string | null
  phone: string | null
  email: string
  avatarUrl: string | null
  loyaltyTier: string
  completedStays: number
  reviewsCount: number
}

const TIER_ICON: Record<string, string> = { new: '⭐', regular: '🥈', vip: '👑' }
const NEXT_TIER: Record<string, { name: string; need: number } | null> = {
  new: { name: 'Постійний', need: 10 },
  regular: { name: 'VIP', need: 30 },
  vip: null,
}

interface AdminStats {
  totalReservations: number
  totalRooms: number
  totalClients: number
  amenitiesCount: number
}

export default function ProfilePage() {
  const { user, updateProfile } = useAuth()
  const { showToast } = useToast()
  const isAdmin = user?.role === 'Admin'

  const [profile, setProfile] = useState<ClientProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const [favorites, setFavorites] = useState<AvailableRoom[]>([])
  const [favRemoving, setFavRemoving] = useState<number | null>(null)
  const [reservationsCount, setReservationsCount] = useState(0)
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null)

  const today = new Date().toISOString().split('T')[0]
  const tomorrow = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0] })()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState('')
  const [changingPw, setChangingPw] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [pwOpen, setPwOpen] = useState(false)

  useEffect(() => {
    if (!user) { setLoading(false); return }

    if (user.role === 'Admin') {
      Promise.all([
        api.get<{ fullName: string; phone: string | null; avatarUrl: string | null }>('/api/auth/profile'),
        api.get<{ totalReservations: number; totalRooms: number }>('/api/statistics'),
        api.get<{ role: string }[]>('/api/users'),
        api.get<unknown[]>('/api/amenities'),
      ]).then(([profileRes, statsRes, usersRes, amenitiesRes]) => {
        const p = profileRes.data
        setFullName(p.fullName ?? '')
        setPhone(p.phone ?? '')
        setAvatarUrl(p.avatarUrl ?? '')
        setProfile({ clientId: 0, fullName: p.fullName, passportData: null, phone: p.phone, email: user.email, avatarUrl: p.avatarUrl, loyaltyTier: '', completedStays: 0, reviewsCount: 0 })
        updateProfile(p.fullName ?? '', p.avatarUrl ?? undefined)
        const clientsCount = usersRes.data.filter((u: { role: string }) => u.role === 'Client').length
        setAdminStats({
          totalReservations: statsRes.data.totalReservations,
          totalRooms: statsRes.data.totalRooms,
          totalClients: clientsCount,
          amenitiesCount: amenitiesRes.data.length,
        })
      }).catch(() => showToast('Не вдалося завантажити профіль', 'error'))
        .finally(() => setLoading(false))
      return
    }

    if (!user?.clientId) { setLoading(false); return }

    Promise.all([
      api.get<ClientProfile>(`/api/client/${user.clientId}`),
      api.get<number[]>('/api/favorite'),
      api.get<AvailableRoom[]>('/api/rooms/available', { params: { checkIn: today, checkOut: tomorrow } }),
      api.get<Reservation[]>(`/api/reservations/by-client/${user.clientId}`),
    ]).then(([profileRes, favIdsRes, roomsRes, resRes]) => {
      const p = profileRes.data
      setProfile(p)
      setFullName(p.fullName)
      setPhone(p.phone ?? '')
      setAvatarUrl(p.avatarUrl ?? '')
      updateProfile(p.fullName, p.avatarUrl ?? undefined)

      const ids = new Set(favIdsRes.data)
      setFavorites(roomsRes.data.filter(r => ids.has(r.roomId)))
      setReservationsCount(resRes.data.length)
    }).catch(() => showToast('Не вдалося завантажити профіль', 'error'))
      .finally(() => setLoading(false))
  }, [user?.userId])

  const removeFav = async (roomId: number) => {
    setFavRemoving(roomId)
    await api.delete(`/api/favorite/${roomId}`)
    setFavorites(rs => rs.filter(r => r.roomId !== roomId))
    setFavRemoving(null)
  }

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setSaving(true); setSaveError('')
    try {
      if (isAdmin) {
        await api.put('/api/auth/profile', { fullName, phone: phone || null, avatarUrl: avatarUrl || null })
      } else {
        await api.put(`/api/client/${profile.clientId}`, {
          clientId: profile.clientId, fullName, phone, email: profile.email,
          passportData: profile.passportData ?? '', avatarUrl,
        })
      }
      setProfile(p => p ? { ...p, fullName, phone } : p)
      updateProfile(fullName, avatarUrl || undefined)
      showToast('Профіль оновлено', 'success')
    } catch {
      setSaveError('Не вдалося зберегти зміни')
      showToast('Не вдалося зберегти зміни', 'error')
    } finally { setSaving(false) }
  }

  const uploadAvatar = async (file: File) => {
    if (!profile) return
    setAvatarUploading(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      const endpoint = isAdmin ? '/api/auth/avatar' : `/api/client/${profile.clientId}/avatar`
      const res = await api.post<{ avatarUrl: string }>(endpoint, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      setAvatarUrl(res.data.avatarUrl)
      updateProfile(fullName, res.data.avatarUrl)
    } catch { showToast('Не вдалося завантажити аватар', 'error') }
    finally { setAvatarUploading(false) }
  }

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError(''); setPwSuccess('')
    if (newPassword !== confirmPassword) { setPwError('Паролі не збігаються'); return }
    if (newPassword.length < 6) { setPwError('Мінімум 6 символів'); return }
    setChangingPw(true)
    try {
      await api.post('/api/auth/change-password', { currentPassword, newPassword })
      setPwSuccess('Пароль успішно змінено')
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
      showToast('Пароль успішно змінено', 'success')
      setTimeout(() => setPwOpen(false), 1500)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: string } })?.response?.data
      const errMsg = typeof msg === 'string' ? msg : 'Не вдалося змінити пароль'
      setPwError(errMsg)
      showToast(errMsg, 'error')
    } finally { setChangingPw(false) }
  }

  const initials = (fullName || user?.email || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const headerName = fullName || (user?.email ? user.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Профіль')

  const inputCls = "w-full bg-white border border-stone-200 rounded-xl pl-10 pr-4 py-3 text-sm text-brown focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/10 transition-all"
  const inputDisabledCls = "w-full bg-stone-50 border border-stone-100 rounded-xl pl-10 pr-4 py-3 text-sm text-brown-light cursor-not-allowed"
  const labelCls = "block text-xs font-medium text-brown-light uppercase tracking-wide mb-1.5"

  return (
    <>
      {/* Header */}
      <div className="bg-brown py-10 px-6 -mt-20 pt-32">
        <div className="max-w-5xl mx-auto flex items-center gap-5">
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-full bg-gold/20 border-2 border-gold/40 flex items-center justify-center overflow-hidden">
              {avatarUrl && !loading
                ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = 'none' }} />
                : <span className="font-serif text-xl text-gold">{initials}</span>}
            </div>
            <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-gold rounded-full flex items-center justify-center cursor-pointer hover:bg-gold-light transition-colors">
              <svg viewBox="0 0 20 20" className="w-3 h-3 fill-brown">
                <path fillRule="evenodd" d="M4 5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1.586a1 1 0 0 1-.707-.293l-1.121-1.121A2 2 0 0 0 11.172 3H8.828a2 2 0 0 0-1.414.586L6.293 4.707A1 1 0 0 1 5.586 5H4zm6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" clipRule="evenodd"/>
              </svg>
              <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadAvatar(f) }} />
            </label>
          </div>
          <div>
            <p className="text-gold/70 text-[10px] tracking-[0.4em] uppercase mb-0.5">Особистий кабінет</p>
            <h1 className="font-serif text-3xl text-white leading-tight">{headerName}</h1>
            <span className="inline-block mt-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-gold/20 text-gold border border-gold/30">
              {isAdmin ? 'Адміністратор' : 'Клієнт'}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8" style={{ background: '#faf9f7' }}>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-40 bg-stone-100 animate-pulse rounded-2xl" />)}
          </div>
        ) : (
          <div className="space-y-4">

            {/* Two-column: personal data + stats/quick-links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">

              {/* Personal data */}
              <div className="bg-white rounded-2xl border border-stone-100 shadow-sm">
                <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
                  <h2 className="text-xs font-semibold text-brown-light uppercase tracking-widest">Особисті дані</h2>
                  <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-stone-300 fill-none" strokeWidth="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                </div>
                <div className="px-6 py-5">
                  {saveError && <div className="bg-red-50 border border-red-100 text-red-600 text-xs px-3 py-2 rounded-lg mb-4">{saveError}</div>}
                  <form onSubmit={saveProfile} className="space-y-4">
                    <div>
                      <label className={labelCls}>Повне імʼя</label>
                      <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 stroke-stone-300 fill-none pointer-events-none" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                        <input value={fullName} onChange={e => setFullName(e.target.value)} required className={inputCls} />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Email</label>
                      <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 stroke-stone-300 fill-none pointer-events-none" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/></svg>
                        <input value={profile?.email ?? ''} disabled className={inputDisabledCls} />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Телефон</label>
                      <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 stroke-stone-300 fill-none pointer-events-none" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.28 2 2 0 0 1 3.59 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.56a16 16 0 0 0 5.53 5.53l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16.92z"/></svg>
                        <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+380..." className={inputCls} />
                      </div>
                    </div>
                    <button type="submit" disabled={saving}
                      className="w-full bg-brown text-ivory py-3 rounded-xl text-sm font-medium hover:bg-gold hover:shadow-md transition-all duration-300 disabled:opacity-50">
                      {saving ? 'Збереження...' : 'Зберегти зміни'}
                    </button>
                  </form>
                </div>
              </div>

              {/* Right column */}
              {<div className="space-y-4">

                {/* Statistics */}
                <div className="bg-white rounded-2xl border border-stone-100 shadow-sm">
                  <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
                    <h2 className="text-xs font-semibold text-brown-light uppercase tracking-widest">
                      {isAdmin ? 'Статистика системи' : 'Статистика'}
                    </h2>
                    <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-stone-300 fill-none" strokeWidth="1.5"><path d="M3 3v18h18"/><path d="m7 16 4-4 4 4 4-4"/></svg>
                  </div>
                  <div className="grid grid-cols-3 divide-x divide-stone-100">
                    {(isAdmin ? [
                      { label: 'Бронювань', value: adminStats?.totalReservations ?? '—' },
                      { label: 'Клієнтів',  value: adminStats?.totalClients ?? '—' },
                      { label: 'Кімнат',    value: adminStats?.totalRooms ?? '—' },
                    ] : [
                      { label: 'Бронювань', value: reservationsCount },
                      { label: 'Улюблених', value: favorites.length },
                      { label: 'Відгуків',  value: profile?.reviewsCount ?? 0 },
                    ]).map(({ label, value }) => (
                      <div key={label} className="px-4 py-5 text-center">
                        <p className="font-serif text-2xl text-brown">{value}</p>
                        <p className="text-[11px] text-brown-light mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick links — admin only */}
                {isAdmin && (
                  <div className="bg-white rounded-2xl border border-stone-100 shadow-sm">
                    <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
                      <h2 className="text-xs font-semibold text-brown-light uppercase tracking-widest">Швидкі переходи</h2>
                      <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-stone-300 fill-none" strokeWidth="1.5"><path d="m13 2 3 3-8 8-3-3 8-8z"/><path d="m11 13-2 2-3-3 2-2"/><path d="M2 22l3-3"/></svg>
                    </div>
                    <div className="p-4 grid grid-cols-3 gap-2">
                      {([
                        { href: '/admin/users',        label: 'Користувачі',   sub: `${adminStats?.totalClients ?? '—'} клієнтів`,   iconD: 'users' },
                        { href: '/admin/rooms',         label: 'Кімнати',       sub: 'CRUD',                                           iconD: 'home' },
                        { href: '/admin/reservations',  label: 'Бронювання',    sub: `${adminStats?.totalReservations ?? '—'} всього`, iconD: 'calendar' },
                        { href: '/admin/pricing',       label: 'Ціноутворення', sub: 'Правила',                                        iconD: 'dollar' },
                        { href: '/admin/amenities',     label: 'Зручності',     sub: `${adminStats?.amenitiesCount ?? '—'} позицій`,   iconD: 'star' },
                        { href: '/admin',               label: 'Дашборд',       sub: 'KPI',                                            iconD: 'chart' },
                      ] as { href: string; label: string; sub: string; iconD: string }[]).map(({ href, label, sub, iconD }) => (
                        <Link key={href} href={href}
                          className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-stone-100 hover:border-gold/40 hover:bg-cream/50 transition-all group text-center">
                          <div className="w-8 h-8 rounded-lg bg-stone-50 border border-stone-100 flex items-center justify-center group-hover:border-gold/30 group-hover:bg-gold/5 transition-colors">
                            <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-brown-light fill-none group-hover:stroke-gold transition-colors" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              {iconD === 'users'    && <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>}
                              {iconD === 'home'     && <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>}
                              {iconD === 'calendar' && <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>}
                              {iconD === 'dollar'   && <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>}
                              {iconD === 'star'     && <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>}
                              {iconD === 'chart'    && <><path d="M3 3v18h18"/><path d="m7 16 4-4 4 4 4-4"/></>}
                            </svg>
                          </div>
                          <p className="text-[11px] font-medium text-brown leading-tight">{label}</p>
                          <p className="text-[10px] text-brown-light">{sub}</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Loyalty — client only */}
                {!isAdmin && profile && (() => {
                  const tierKey = profile.loyaltyTier || 'new'
                  const tier = TIER_LABELS[tierKey] ?? { label: tierKey, color: 'bg-slate-100 text-slate-600' }
                  const icon = TIER_ICON[tierKey] ?? '⭐'
                  const next = NEXT_TIER[tierKey]
                  const stays = profile.completedStays ?? 0
                  const progress = next ? Math.min(100, Math.round((stays / next.need) * 100)) : 100

                  return (
                    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm">
                      <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
                        <h2 className="text-xs font-semibold text-brown-light uppercase tracking-widest">Рівень лояльності</h2>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${tier.color}`}>{icon} {tier.label.toUpperCase()}</span>
                      </div>
                      <div className="px-6 py-5 space-y-4">
                        {next ? (
                          <>
                            <div className="flex justify-between text-xs text-brown-light">
                              <span>Прогрес до {next.name}</span>
                              <span className="font-medium text-brown">{stays} / {next.need}</span>
                            </div>
                            <div className="relative">
                              <div className="w-full bg-stone-100 rounded-full h-2">
                                <div className="bg-gold h-2 rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
                              </div>
                              <div className="flex justify-between mt-2 text-[10px] text-stone-400">
                                <span>New</span>
                                <span>Regular</span>
                                <span>VIP</span>
                              </div>
                            </div>
                            <p className="text-xs text-brown-light">
                              {next.need - stays > 0 ? `Ще ${next.need - stays} заселень до рівня «${next.name}»` : 'Рівень досягнуто!'}
                            </p>
                          </>
                        ) : (
                          <p className="text-sm text-amber-600 font-medium text-center py-2">👑 Максимальний рівень досягнуто!</p>
                        )}
                      </div>
                    </div>
                  )
                })()}
              </div>}
            </div>

            {/* Favorites — client only */}
            {!isAdmin && (
              <div className="bg-white rounded-2xl border border-stone-100 shadow-sm">
                <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
                  <h2 className="text-xs font-semibold text-brown-light uppercase tracking-widest">Улюблені номери</h2>
                  {favorites.length > 0 && (
                    <span className="text-xs text-brown-light bg-stone-50 border border-stone-100 rounded-full px-3 py-1">{favorites.length} збережено</span>
                  )}
                </div>
                <div className="px-6 py-5">
                  {favorites.length === 0 ? (
                    <div className="text-center py-6">
                      <svg viewBox="0 0 24 24" className="w-9 h-9 mx-auto mb-3 fill-none stroke-stone-200" strokeWidth="1.2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                      <p className="text-sm text-brown-light">Немає збережених номерів</p>
                      <p className="text-xs text-stone-400 mt-1">Натисніть ♡ на картці номера щоб зберегти</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {favorites.map(r => (
                        <div key={r.roomId} className="flex gap-3 border border-stone-100 rounded-xl p-3 hover:border-gold/30 hover:shadow-sm transition-all">
                          <Link href={`/rooms/${r.roomId}?checkIn=${today}&checkOut=${tomorrow}`} className="shrink-0">
                            {r.photoUrl
                              ? <img src={r.photoUrl} alt="" className="w-20 h-16 object-cover rounded-lg" />
                              : <div className="w-20 h-16 bg-stone-100 rounded-lg flex items-center justify-center"><span className="font-serif text-2xl text-stone-300">H</span></div>}
                          </Link>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-serif text-sm text-brown">Кімната №{r.roomNumber}</p>
                                <p className="text-xs text-brown-light">{ROOM_TYPE_UA[r.roomType] ?? r.roomType} · {r.capacity} гост.</p>
                              </div>
                              <span className="font-serif text-sm text-gold shrink-0">${r.price}<span className="text-xs text-brown-light font-sans">/ніч</span></span>
                            </div>
                            <div className="flex gap-2 mt-2">
                              <Link href={`/rooms/${r.roomId}?checkIn=${today}&checkOut=${tomorrow}`}
                                className="text-[10px] font-medium text-brown-mid bg-stone-50 border border-stone-200 rounded-lg px-3 py-1 hover:border-gold/50 transition-colors">
                                Детальніше
                              </Link>
                              <button onClick={() => removeFav(r.roomId)} disabled={favRemoving === r.roomId}
                                className="text-[10px] text-stone-400 hover:text-red-400 transition-colors disabled:opacity-40 px-2">
                                ✕
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Change password */}
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
              <button type="button" onClick={() => { setPwOpen(v => !v); setPwError(''); setPwSuccess('') }}
                className="w-full px-6 py-4 flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-stone-50 border border-stone-200 flex items-center justify-center group-hover:border-gold/40 transition-colors">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 stroke-brown-light fill-none" strokeWidth="1.5" strokeLinecap="round">
                      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-brown-light uppercase tracking-widest">Зміна паролю</span>
                </div>
                <svg viewBox="0 0 20 20" className={`w-4 h-4 fill-stone-400 transition-transform duration-300 ${pwOpen ? 'rotate-180' : ''}`}>
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 0 1 1.414 0L10 10.586l3.293-3.293a1 1 0 1 1 1.414 1.414l-4 4a1 1 0 0 1-1.414 0l-4-4a1 1 0 0 1 0-1.414z" clipRule="evenodd"/>
                </svg>
              </button>

              <div className={`transition-all duration-300 ease-in-out ${pwOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                <div className="px-6 pb-5 pt-4 border-t border-stone-100">
                  {pwError   && <div className="bg-red-50 border border-red-100 text-red-600 text-xs px-3 py-2 rounded-lg mb-4">{pwError}</div>}
                  {pwSuccess && <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs px-3 py-2 rounded-lg mb-4">{pwSuccess}</div>}
                  <form onSubmit={changePassword} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <PwField label="Поточний пароль" value={currentPassword} onChange={setCurrentPassword} show={showCurrent} toggle={() => setShowCurrent(v => !v)} />
                    <PwField label="Новий пароль"    value={newPassword}     onChange={setNewPassword}     show={showNew}     toggle={() => setShowNew(v => !v)} />
                    <div>
                      <label className={labelCls}>Підтвердити пароль</label>
                      <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                        className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm text-brown focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/10 transition-all" />
                    </div>
                    <div className="md:col-span-3 flex gap-3">
                      <button type="submit" disabled={changingPw}
                        className="inline-flex items-center gap-2 bg-brown text-ivory px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-gold hover:shadow-md transition-all disabled:opacity-50">
                        {changingPw ? 'Збереження...' : 'Змінити пароль'}
                      </button>
                      <button type="button" onClick={() => { setPwOpen(false); setPwError(''); setCurrentPassword(''); setNewPassword(''); setConfirmPassword('') }}
                        className="px-6 py-2.5 rounded-xl text-sm text-brown-light border border-stone-200 hover:border-stone-300 transition-colors">
                        Скасувати
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </>
  )
}

function PwField({ label, value, onChange, show, toggle }: {
  label: string; value: string; onChange: (v: string) => void; show: boolean; toggle: () => void
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-brown-light uppercase tracking-wide mb-1.5">{label}</label>
      <div className="relative">
        <input type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)} required
          className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 pr-20 text-sm text-brown focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/10 transition-all" />
        <button type="button" onClick={toggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-brown-light hover:text-brown transition-colors select-none">
          {show ? 'Сховати' : 'Показати'}
        </button>
      </div>
    </div>
  )
}
