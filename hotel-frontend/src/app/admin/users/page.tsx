'use client'

import { useState, useEffect, useMemo } from 'react'
import api from '@/lib/api'
import { UserAdminDto } from '@/lib/types'
import { TIER_LABELS } from '@/lib/constants'

function TierBadge({ tier }: { tier: string | null }) {
  const t = TIER_LABELS[tier ?? 'new'] ?? TIER_LABELS['new']
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${t.color}`}>{t.label}</span>
  )
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserAdminDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionId, setActionId] = useState<number | null>(null)
  const [tierChanging, setTierChanging] = useState<number | null>(null)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return users
    const q = search.toLowerCase()
    return users.filter(u =>
      u.email.toLowerCase().includes(q) ||
      u.clientName?.toLowerCase().includes(q)
    )
  }, [users, search])

  const load = () => api.get<UserAdminDto[]>('/api/users')
    .then(r => setUsers(r.data))
    .catch(() => setError('Не вдалося завантажити'))
    .finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const toggleBlock = async (u: UserAdminDto) => {
    setActionId(u.userId)
    try {
      await api.post(`/api/users/${u.userId}/${u.isBlocked ? 'unblock' : 'block'}`)
      setUsers(us => us.map(x => x.userId === u.userId ? { ...x, isBlocked: !x.isBlocked } : x))
    } catch {
      setError('Помилка')
    } finally {
      setActionId(null)
    }
  }

  const setTier = async (u: UserAdminDto, tier: string) => {
    setTierChanging(u.userId)
    try {
      await api.put(`/api/users/${u.userId}/loyalty`, { tier })
      setUsers(us => us.map(x => x.userId === u.userId ? { ...x, loyaltyTier: tier } : x))
    } catch {
      setError('Не вдалося змінити статус')
    } finally {
      setTierChanging(null)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-brown">Користувачі</h1>
        <input type="text" placeholder="Пошук по імені або email..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="ml-auto border border-beige rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-gold w-64" />
        <span className="text-sm text-brown-light shrink-0">{filtered.length} з {users.length}</span>
      </div>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}
      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="bg-ivory rounded-2xl border border-beige-light h-12 animate-pulse" />)}</div>
      ) : (
        <div className="bg-ivory rounded-2xl border border-beige-light shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream border-b">
              <tr>
                {['ID', 'Email', "Ім'я", 'Роль', 'Заселень', 'Лояльність', 'Зареєстрований', 'Статус', 'Дії'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-brown-light uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(u => (
                <tr key={u.userId} className={`hover:bg-cream ${u.isBlocked ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3 text-brown-light">#{u.userId}</td>
                  <td className="px-4 py-3 font-medium">{u.email}</td>
                  <td className="px-4 py-3 text-brown-light">{u.clientName ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.role === 'Admin' ? 'bg-purple-100 text-purple-700' : 'bg-cream text-gold-dark'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.role !== 'Admin' ? (
                      <div className="flex flex-col gap-1 min-w-16">
                        <span className="text-xs font-semibold text-brown">{u.completedStays}</span>
                        <div className="w-full h-1.5 bg-beige rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${u.completedStays >= 10 ? 'bg-gold' : 'bg-brown-light'}`}
                            style={{ width: `${Math.min(100, (u.completedStays / 10) * 100)}%` }}
                          />
                        </div>
                        {u.completedStays < 10 && (
                          <span className="text-[10px] text-brown-light/70">{10 - u.completedStays} до Постійного</span>
                        )}
                      </div>
                    ) : <span className="text-brown-light text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {u.role !== 'Admin' ? (
                      <div className="flex items-center gap-1.5">
                        <TierBadge tier={u.loyaltyTier} />
                        <select
                          value={u.loyaltyTier ?? 'new'}
                          disabled={tierChanging === u.userId}
                          onChange={e => setTier(u, e.target.value)}
                          className="text-xs border border-beige rounded px-1 py-0.5 text-brown-mid bg-white focus:outline-none focus:border-gold disabled:opacity-50 cursor-pointer"
                        >
                          {Object.entries(TIER_LABELS).map(([value, { label }]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                      </div>
                    ) : <span className="text-brown-light text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 text-brown-light">{new Date(u.createdAt).toLocaleDateString('uk-UA')}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.isBlocked ? 'bg-red-100 text-red-700' : 'bg-sage/10 text-sage'}`}>
                      {u.isBlocked ? 'Заблоковано' : 'Активний'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.role !== 'Admin' && (
                      <button
                        onClick={() => toggleBlock(u)}
                        disabled={actionId === u.userId}
                        className={`text-xs font-medium hover:underline disabled:opacity-50 ${u.isBlocked ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {actionId === u.userId ? '...' : u.isBlocked ? 'Розблокувати' : 'Заблокувати'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="text-center text-brown-light py-8">{search ? 'Нічого не знайдено' : 'Немає користувачів'}</p>}
        </div>
      )}
    </div>
  )
}
