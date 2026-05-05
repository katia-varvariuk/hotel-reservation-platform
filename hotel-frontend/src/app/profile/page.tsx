'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { AvailableRoom } from '@/lib/types'

const ROOM_TYPE_UA: Record<string, string> = { Standard: 'Стандарт', Deluxe: 'Делюкс', Suite: 'Сюїт' }

interface ClientProfile {
  clientId: number
  fullName: string
  passportData: string | null
  phone: string | null
  email: string
  avatarUrl: string | null
}

export default function ProfilePage() {
  const { user } = useAuth()
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

  useEffect(() => {
    if (user?.role === 'Client') {
      Promise.all([
        api.get<number[]>('/api/favorite'),
        api.get<AvailableRoom[]>('/api/rooms/available', { params: { checkIn: today, checkOut: tomorrow } }),
      ]).then(([favRes, roomsRes]) => {
        const ids = new Set(favRes.data)
        setFavorites(roomsRes.data.filter(r => ids.has(r.roomId)))
      }).catch(() => {})
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
    } catch { setError('Не вдалося зберегти зміни') }
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
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: string } })?.response?.data
      setPwError(typeof msg === 'string' ? msg : 'Не вдалося змінити пароль')
    } finally { setChangingPw(false) }
  }

  const initials = user?.email ? user.email[0].toUpperCase() : '?'
  const displayName = user?.email ? user.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : ''

  const inputCls = "w-full bg-cream border border-beige px-4 py-3 text-sm text-brown focus:outline-none focus:border-brown-light transition-colors"
  const inputDisabledCls = "w-full bg-beige/30 border border-beige/50 px-4 py-3 text-sm text-brown-light cursor-not-allowed"
  const labelCls = "block text-[10px] tracking-[0.3em] uppercase text-brown-light mb-2"

  return (
    <>
      {/* Page header */}
      <div className="bg-brown py-16 px-6 -mt-20 pt-36">
        <div className="max-w-4xl mx-auto flex items-end gap-6">
          <div className="w-16 h-16 bg-gold/20 border border-gold/30 flex items-center justify-center shrink-0">
            {avatarUrl && !loading ? (
              <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover"
                onError={e => { e.currentTarget.style.display = 'none' }} />
            ) : (
              <span className="font-serif text-2xl text-gold">{initials}</span>
            )}
          </div>
          <div>
            <p className="text-gold text-[10px] tracking-[0.5em] uppercase mb-1">Особистий кабінет</p>
            <h1 className="font-serif text-4xl text-white">{displayName || 'Профіль'}</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-6">

        {loading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => <div key={i} className="h-40 bg-beige/30 animate-pulse" />)}
          </div>
        ) : (user?.clientId || isAdmin) ? (
          <>
            {/* Personal info */}
            <div className="bg-ivory border border-beige">
              <div className="px-8 py-5 border-b border-beige flex items-center justify-between">
                <h2 className="font-serif text-xl text-brown">Особисті дані</h2>
              </div>
              <div className="px-8 py-6">
                {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 mb-5">{error}</div>}
                {success && <div className="bg-sage/10 border border-sage/30 text-sage text-sm px-4 py-3 mb-5">{success}</div>}

                <form onSubmit={saveProfile} className="space-y-5">
                  {/* Avatar */}
                  <div className="flex items-center gap-5 pb-5 border-b border-beige">
                    <div className="w-20 h-20 bg-cream border border-beige flex items-center justify-center overflow-hidden shrink-0">
                      {avatarUrl
                        ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover"
                            onError={e => (e.currentTarget.style.display = 'none')} />
                        : <span className="font-serif text-3xl text-gold/40">{initials}</span>
                      }
                    </div>
                    <div>
                      <label className={`cursor-pointer inline-flex items-center gap-2 border border-beige px-4 py-2.5 text-xs tracking-[0.2em] uppercase text-brown-mid hover:border-brown-light transition-colors ${avatarUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                        <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 fill-current opacity-60">
                          <path fillRule="evenodd" d="M4 5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1.586a1 1 0 0 1-.707-.293l-1.121-1.121A2 2 0 0 0 11.172 3H8.828a2 2 0 0 0-1.414.586L6.293 4.707A1 1 0 0 1 5.586 5H4zm6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" clipRule="evenodd"/>
                        </svg>
                        {avatarUploading ? 'Завантаження...' : 'Змінити фото'}
                        <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadAvatar(f) }} />
                      </label>
                      <p className="text-xs text-brown-light mt-2">JPG, PNG, GIF, WEBP — до 5 МБ</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className={labelCls}>Повне ім&apos;я</label>
                      <input value={fullName} onChange={e => setFullName(e.target.value)} required className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Email</label>
                      <input value={profile?.email ?? ''} disabled className={inputDisabledCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Телефон</label>
                      <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+380..." className={inputCls} />
                    </div>
                  </div>

                  <button type="submit" disabled={saving}
                    className="bg-brown text-ivory px-7 py-3 text-xs tracking-[0.3em] uppercase hover:bg-gold transition-colors duration-300 disabled:opacity-50">
                    {saving ? 'Збереження...' : 'Зберегти зміни'}
                  </button>
                </form>
              </div>
            </div>

            {/* Change password */}
            <div className="bg-ivory border border-beige">
              <div className="px-8 py-5 border-b border-beige">
                <h2 className="font-serif text-xl text-brown">Зміна паролю</h2>
              </div>
              <div className="px-8 py-6">
                {pwError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 mb-5">{pwError}</div>}
                {pwSuccess && <div className="bg-sage/10 border border-sage/30 text-sage text-sm px-4 py-3 mb-5">{pwSuccess}</div>}
                <form onSubmit={changePassword} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <PwField label="Поточний пароль" value={currentPassword} onChange={setCurrentPassword} show={showCurrent} toggle={() => setShowCurrent(v => !v)} cls={inputCls} />
                    <PwField label="Новий пароль" value={newPassword} onChange={setNewPassword} show={showNew} toggle={() => setShowNew(v => !v)} cls={inputCls} />
                    <div>
                      <label className={labelCls}>Підтвердити пароль</label>
                      <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className={inputCls} />
                    </div>
                  </div>
                  <button type="submit" disabled={changingPw}
                    className="bg-brown text-ivory px-7 py-3 text-xs tracking-[0.3em] uppercase hover:bg-gold transition-colors duration-300 disabled:opacity-50">
                    {changingPw ? 'Збереження...' : 'Змінити пароль'}
                  </button>
                </form>
              </div>
            </div>
            {/* Favorites — client only */}
            {!isAdmin && (
              <div className="bg-ivory border border-beige">
                <div className="px-8 py-5 border-b border-beige flex items-center justify-between">
                  <h2 className="font-serif text-xl text-brown">Улюблені номери</h2>
                  {favorites.length > 0 && (
                    <span className="text-xs text-brown-light">{favorites.length} збережено</span>
                  )}
                </div>
                <div className="px-8 py-6">
                  {favorites.length === 0 ? (
                    <div className="text-center py-8">
                      <svg viewBox="0 0 24 24" className="w-10 h-10 mx-auto mb-3 fill-none stroke-beige" strokeWidth="1.2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                      <p className="text-sm text-brown-light">Немає збережених номерів</p>
                      <p className="text-xs text-brown-light/60 mt-1">Натисніть ♡ на картці номера щоб зберегти</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {favorites.map(r => (
                        <div key={r.roomId} className="flex gap-3 border border-beige/60 p-3 group hover:border-brown-light transition-colors">
                          <Link href={`/rooms/${r.roomId}?checkIn=${today}&checkOut=${tomorrow}`} className="shrink-0">
                            {r.photoUrl
                              ? <img src={r.photoUrl} alt="" className="w-20 h-16 object-cover" />
                              : <div className="w-20 h-16 bg-beige/30 flex items-center justify-center"><span className="font-serif text-2xl text-beige">H</span></div>
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
                                className="text-[10px] tracking-widest uppercase text-brown-mid border border-beige px-3 py-1 hover:border-gold transition-colors">
                                Детальніше
                              </Link>
                              <button onClick={() => removeFav(r.roomId)} disabled={favRemoving === r.roomId}
                                className="text-[10px] text-brown-light/60 hover:text-red-400 transition-colors disabled:opacity-40 px-2">
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
  const labelCls = "block text-[10px] tracking-[0.3em] uppercase text-brown-light mb-2"
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="relative">
        <input type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)} required
          className={cls + ' pr-20'} />
        <button type="button" onClick={toggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] tracking-[0.15em] uppercase text-brown-light hover:text-brown transition-colors select-none">
          {show ? 'Сховати' : 'Показати'}
        </button>
      </div>
    </div>
  )
}
