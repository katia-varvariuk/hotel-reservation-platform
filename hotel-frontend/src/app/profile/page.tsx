'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { AvailableRoom } from '@/lib/types'
import { ROOM_TYPE_UA } from '@/lib/constants'

interface ClientProfile {
  clientId: number
  fullName: string
  passportData: string | null
  phone: string | null
  email: string
  avatarUrl: string | null
}

export default function ProfilePage() {
  const { user, updateProfile } = useAuth()
  const { showToast } = useToast()
  const [profile, setProfile] = useState<ClientProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const isAdmin = user?.role === 'Admin'

  const [favorites, setFavorites] = useState<AvailableRoom[]>([])
  const [favRemoving, setFavRemoving] = useState<number | null>(null)

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
    if (user?.role === 'Client') {
      Promise.all([
        api.get<number[]>('/api/favorite'),
        api.get<AvailableRoom[]>('/api/rooms/available', { params: { checkIn: today, checkOut: tomorrow } }),
      ]).then(([favRes, roomsRes]) => {
        const ids = new Set(favRes.data)
        setFavorites(roomsRes.data.filter(r => ids.has(r.roomId)))
      }).catch(() => { showToast('Не вдалося завантажити улюблені номери', 'error') })
    }
  }, [user])

  const removeFav = async (roomId: number) => {
    setFavRemoving(roomId)
    await api.delete(`/api/favorite/${roomId}`)
    setFavorites(rs => rs.filter(r => r.roomId !== roomId))
    setFavRemoving(null)
  }

  useEffect(() => {
    if (!user) { setLoading(false); return }
    if (user.role === 'Admin') {
      api.get<{ fullName: string; phone: string | null; avatarUrl: string | null }>('/api/auth/profile')
        .then(res => {
          setFullName(res.data.fullName ?? '')
          setPhone(res.data.phone ?? '')
          setAvatarUrl(res.data.avatarUrl ?? '')
          setProfile({ clientId: 0, fullName: res.data.fullName, passportData: null, phone: res.data.phone, email: user.email, avatarUrl: res.data.avatarUrl })
          updateProfile(res.data.fullName ?? '', res.data.avatarUrl ?? undefined)
        })
        .catch(() => setError('Не вдалося завантажити профіль'))
        .finally(() => setLoading(false))
      return
    }
    if (!user?.clientId) { setLoading(false); return }
    api.get<ClientProfile>(`/api/client/${user.clientId}`)
      .then(res => {
        setProfile(res.data)
        setFullName(res.data.fullName)
        setPhone(res.data.phone ?? '')
        setAvatarUrl(res.data.avatarUrl ?? '')
        updateProfile(res.data.fullName, res.data.avatarUrl ?? undefined)
      })
      .catch(() => setError('Не вдалося завантажити профіль'))
      .finally(() => setLoading(false))
  }, [user])

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setSaving(true); setError(''); setSuccess('')
    try {
      if (isAdmin) {
        await api.put('/api/auth/profile', { fullName, phone: phone || null, avatarUrl: avatarUrl || null })
      } else {
        await api.put(`/api/client/${profile.clientId}`, {
          clientId: profile.clientId, fullName, phone, email: profile.email,
          passportData: profile.passportData ?? '', avatarUrl,
        })
      }
      setSuccess('Профіль оновлено')
      setProfile(p => p ? { ...p, fullName, phone } : p)
      updateProfile(fullName, avatarUrl || undefined)
      showToast('Профіль оновлено', 'success')
    } catch { setError('Не вдалося зберегти зміни'); showToast('Не вдалося зберегти зміни', 'error') }
    finally { setSaving(false) }
  }

  const uploadAvatar = async (file: File) => {
    if (!profile) return
    setAvatarUploading(true); setError('')
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      const endpoint = isAdmin ? '/api/auth/avatar' : `/api/client/${profile.clientId}/avatar`
      const res = await api.post<{ avatarUrl: string }>(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setAvatarUrl(res.data.avatarUrl)
      updateProfile(fullName, res.data.avatarUrl)
    } catch { setError('Не вдалося завантажити аватар') }
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
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: string } })?.response?.data
      const errMsg = typeof msg === 'string' ? msg : 'Не вдалося змінити пароль'
      setPwError(errMsg)
      showToast(errMsg, 'error')
    } finally { setChangingPw(false) }
  }

  const headerName = fullName || (user?.email
    ? user.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : 'Профіль')

  const inputCls = "w-full bg-white border border-stone-200 rounded-xl pl-10 pr-4 py-3.5 text-sm text-brown focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/10 transition-all"
  const inputDisabledCls = "w-full bg-stone-50 border border-stone-100 rounded-xl pl-10 pr-4 py-3.5 text-sm text-brown-light cursor-not-allowed"
  const labelCls = "block text-xs font-medium text-brown-light mb-1.5"
  const btnCls = "w-full flex items-center justify-center gap-2 bg-brown text-ivory px-6 py-3.5 rounded-xl text-sm font-medium hover:bg-gold hover:shadow-md transition-all duration-300 disabled:opacity-50 shadow-sm"

  const AvatarPlaceholder = () => (
    <svg viewBox="0 0 24 24" className="w-12 h-12 stroke-gold/40 fill-none" strokeWidth="1" strokeLinecap="round">
      <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
  )

  return (
    <>
      {/* Page header */}
      <div className="bg-brown py-16 px-6 -mt-20 pt-36">
        <div className="max-w-4xl mx-auto flex items-end gap-6">
          <div className="w-16 h-16 rounded-full bg-gold/20 border-2 border-gold/30 flex items-center justify-center shrink-0 overflow-hidden">
            {avatarUrl && !loading
              ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = 'none' }} />
              : <AvatarPlaceholder />}
          </div>
          <div>
            <p className="text-gold text-[10px] tracking-[0.5em] uppercase mb-1">Особистий кабінет</p>
            <h1 className="font-serif text-4xl text-white">{headerName}</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-4" style={{ background: '#faf9f7' }}>

        {loading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => <div key={i} className="h-40 bg-stone-100 animate-pulse rounded-2xl" />)}
          </div>
        ) : (user?.clientId || isAdmin) ? (
          <>
            {/* Personal info */}
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm">
              <div className="px-8 py-5 border-b border-stone-100">
                <h2 className="font-serif text-xl text-brown">Особисті дані</h2>
              </div>
              <div className="px-8 py-6">
                {error && <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl mb-5">{error}</div>}
                {success && <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm px-4 py-3 rounded-xl mb-5">{success}</div>}

                <form onSubmit={saveProfile} className="space-y-5">
                  {/* Avatar */}
                  <div className="flex items-center gap-5 pb-5 border-b border-stone-100">
                    <div className="w-20 h-20 rounded-full bg-stone-100 border-2 border-stone-200 flex items-center justify-center overflow-hidden shrink-0">
                      {avatarUrl
                        ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                        : <AvatarPlaceholder />}
                    </div>
                    <div>
                      <label className={`cursor-pointer inline-flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-xs font-medium text-brown-mid hover:border-gold/50 hover:bg-gold/5 transition-all ${avatarUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                        <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 fill-current opacity-60">
                          <path fillRule="evenodd" d="M4 5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1.586a1 1 0 0 1-.707-.293l-1.121-1.121A2 2 0 0 0 11.172 3H8.828a2 2 0 0 0-1.414.586L6.293 4.707A1 1 0 0 1 5.586 5H4zm6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" clipRule="evenodd"/>
                        </svg>
                        {avatarUploading ? 'Завантаження...' : 'Змінити фото'}
                        <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadAvatar(f) }} />
                      </label>
                      <p className="text-xs text-brown-light mt-2">JPG, PNG, WEBP — до 5 МБ</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Full name */}
                    <div>
                      <label className={labelCls}>Повне ім&apos;я</label>
                      <div className="relative">
                        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 stroke-stone-300 fill-none pointer-events-none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                          <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                        </svg>
                        <input value={fullName} onChange={e => setFullName(e.target.value)} required className={inputCls} />
                      </div>
                    </div>
                    {/* Email */}
                    <div>
                      <label className={labelCls}>Email</label>
                      <div className="relative">
                        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 stroke-stone-300 fill-none pointer-events-none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                          <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/>
                        </svg>
                        <input value={profile?.email ?? ''} disabled className={inputDisabledCls} />
                      </div>
                    </div>
                    {/* Phone */}
                    <div>
                      <label className={labelCls}>Телефон</label>
                      <div className="relative">
                        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 stroke-stone-300 fill-none pointer-events-none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.28 2 2 0 0 1 3.59 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.56a16 16 0 0 0 5.53 5.53l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16.92z"/>
                        </svg>
                        <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+380..." className={inputCls} />
                      </div>
                    </div>
                  </div>

                  <button type="submit" disabled={saving} className={btnCls}>
                    {saving ? 'Збереження...' : 'Зберегти зміни'}
                  </button>
                </form>
              </div>
            </div>

            {/* Change password */}
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => { setPwOpen(v => !v); setPwError(''); setPwSuccess('') }}
                className="w-full px-8 py-5 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-stone-50 border border-stone-200 flex items-center justify-center group-hover:border-gold/40 transition-colors">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-brown-light fill-none" strokeWidth="1.5" strokeLinecap="round">
                      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <span className="font-serif text-xl text-brown">Зміна паролю</span>
                </div>
                <svg viewBox="0 0 20 20" className={`w-4 h-4 fill-stone-400 transition-transform duration-300 ${pwOpen ? 'rotate-180' : ''}`}>
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 0 1 1.414 0L10 10.586l3.293-3.293a1 1 0 1 1 1.414 1.414l-4 4a1 1 0 0 1-1.414 0l-4-4a1 1 0 0 1 0-1.414z" clipRule="evenodd"/>
                </svg>
              </button>

              <div className={`transition-all duration-300 ease-in-out ${pwOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                <div className="px-8 pb-6 border-t border-stone-100 pt-5">
                  {pwError && <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl mb-5">{pwError}</div>}
                  {pwSuccess && <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm px-4 py-3 rounded-xl mb-5">{pwSuccess}</div>}
                  <form onSubmit={async e => { await changePassword(e); if (!pwError) setPwOpen(false) }} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <PwField label="Поточний пароль" value={currentPassword} onChange={setCurrentPassword} show={showCurrent} toggle={() => setShowCurrent(v => !v)} cls="w-full bg-white border border-stone-200 rounded-xl px-4 py-3.5 text-sm text-brown focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/10 transition-all" />
                      <PwField label="Новий пароль" value={newPassword} onChange={setNewPassword} show={showNew} toggle={() => setShowNew(v => !v)} cls="w-full bg-white border border-stone-200 rounded-xl px-4 py-3.5 text-sm text-brown focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/10 transition-all" />
                      <div>
                        <label className={labelCls}>Підтвердити пароль</label>
                        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3.5 text-sm text-brown focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/10 transition-all" />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button type="submit" disabled={changingPw} className="inline-flex items-center justify-center gap-2 bg-brown text-ivory px-6 py-3 rounded-xl text-sm font-medium hover:bg-gold hover:shadow-md transition-all duration-300 disabled:opacity-50 shadow-sm">
                        {changingPw ? 'Збереження...' : 'Змінити пароль'}
                      </button>
                      <button type="button" onClick={() => { setPwOpen(false); setPwError(''); setCurrentPassword(''); setNewPassword(''); setConfirmPassword('') }}
                        className="px-6 py-3 rounded-xl text-sm font-medium text-brown-light border border-stone-200 hover:border-stone-300 transition-colors">
                        Скасувати
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Favorites — client only */}
            {!isAdmin && (
              <div className="bg-white rounded-2xl border border-stone-100 shadow-sm">
                <div className="px-8 py-5 border-b border-stone-100 flex items-center justify-between">
                  <h2 className="font-serif text-xl text-brown">Улюблені номери</h2>
                  {favorites.length > 0 && (
                    <span className="text-xs text-brown-light bg-stone-50 border border-stone-100 rounded-full px-3 py-1">{favorites.length} збережено</span>
                  )}
                </div>
                <div className="px-8 py-6">
                  {favorites.length === 0 ? (
                    <div className="text-center py-8">
                      <svg viewBox="0 0 24 24" className="w-10 h-10 mx-auto mb-3 fill-none stroke-stone-200" strokeWidth="1.2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                      <p className="text-sm text-brown-light">Немає збережених номерів</p>
                      <p className="text-xs text-stone-400 mt-1">Натисніть ♡ на картці номера щоб зберегти</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {favorites.map(r => (
                        <div key={r.roomId} className="flex gap-3 border border-stone-100 rounded-xl p-3 group hover:border-gold/30 hover:shadow-sm transition-all">
                          <Link href={`/rooms/${r.roomId}?checkIn=${today}&checkOut=${tomorrow}`} className="shrink-0">
                            {r.photoUrl
                              ? <img src={r.photoUrl} alt="" className="w-20 h-16 object-cover rounded-lg" />
                              : <div className="w-20 h-16 bg-stone-100 rounded-lg flex items-center justify-center"><span className="font-serif text-2xl text-stone-300">H</span></div>
                            }
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
          </>
        ) : null}
      </div>
    </>
  )
}

function PwField({ label, value, onChange, show, toggle, cls }: {
  label: string; value: string; onChange: (v: string) => void; show: boolean; toggle: () => void; cls: string
}) {
  const labelCls = "block text-xs font-medium text-brown-light mb-1.5"
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="relative">
        <input type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)} required
          className={cls + ' pr-20'} />
        <button type="button" onClick={toggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-brown-light hover:text-brown transition-colors select-none">
          {show ? 'Сховати' : 'Показати'}
        </button>
      </div>
    </div>
  )
}
