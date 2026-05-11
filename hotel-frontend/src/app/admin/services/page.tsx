'use client'

import { useState, useEffect, FormEvent } from 'react'
import api from '@/lib/api'

interface HotelService {
  serviceId: number
  category: string
  name: string
  description: string | null
  price: number
  unit: string | null
  includedIn: string | null
  sortOrder: number
}

const EMPTY_FORM = {
  category: '',
  name: '',
  description: '',
  price: '',
  unit: '',
  includedIn: '',
  sortOrder: '0',
}

const CATEGORIES = ['Харчування', 'SPA & Велнес', 'Активний відпочинок', 'Додаткові послуги']

export default function AdminServicesPage() {
  const [services, setServices] = useState<HotelService[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [editing, setEditing] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)

  const load = async () => {
    try {
      const res = await api.get<HotelService[]>('/api/services')
      setServices(res.data)
    } catch {
      setError('Не вдалося завантажити послуги')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const grouped = CATEGORIES.map(cat => ({
    category: cat,
    items: services.filter(s => s.category === cat),
  })).filter(g => g.items.length > 0 || showForm)

  const openEdit = (s: HotelService) => {
    setForm({
      category: s.category,
      name: s.name,
      description: s.description ?? '',
      price: s.price.toString(),
      unit: s.unit ?? '',
      includedIn: s.includedIn ?? '',
      sortOrder: s.sortOrder.toString(),
    })
    setEditing(s.serviceId)
    setShowForm(true)
  }

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setEditing(null)
    setShowForm(true)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    const payload = {
      category: form.category,
      name: form.name,
      description: form.description || null,
      price: Number(form.price),
      unit: form.unit || null,
      includedIn: form.includedIn || null,
      sortOrder: Number(form.sortOrder),
    }
    try {
      if (editing != null) {
        await api.put(`/api/services/${editing}`, payload)
      } else {
        await api.post('/api/services', payload)
      }
      setShowForm(false)
      await load()
    } catch {
      setError('Помилка збереження')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Видалити послугу?')) return
    setDeleting(id)
    try {
      await api.delete(`/api/services/${id}`)
      await load()
    } catch {
      setError('Не вдалося видалити')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-brown">Управління послугами</h1>
        <button onClick={openCreate}
          className="bg-gold text-white px-4 py-2 rounded-xl hover:bg-gold-dark text-sm font-medium">
          + Додати послугу
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>
      )}

      {showForm && (
        <div className="bg-ivory rounded-2xl border border-beige-light shadow-sm p-5 mb-6">
          <h2 className="text-base font-semibold text-brown mb-4">
            {editing != null ? 'Редагувати послугу' : 'Нова послуга'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-brown-light mb-1">Категорія *</label>
              <select required value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold">
                <option value="">Оберіть...</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-brown-light mb-1">Назва *</label>
              <input required type="text" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
                placeholder="Наприклад: SPA-сеанс" />
            </div>
            <div className="col-span-2 md:col-span-3">
              <label className="block text-xs font-medium text-brown-light mb-1">Опис</label>
              <textarea rows={2} value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
                placeholder="Короткий опис послуги..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-brown-light mb-1">Ціна ($) *</label>
              <input required type="number" min={0} step={0.01} value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
            </div>
            <div>
              <label className="block text-xs font-medium text-brown-light mb-1">Одиниця</label>
              <input type="text" value={form.unit}
                onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
                placeholder="особа, сеанс, ніч..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-brown-light mb-1">Включено у (тип номеру)</label>
              <input type="text" value={form.includedIn}
                onChange={e => setForm(f => ({ ...f, includedIn: e.target.value }))}
                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
                placeholder="Deluxe, Suite" />
            </div>
            <div className="col-span-2 md:col-span-3 flex gap-3">
              <button type="submit" disabled={saving}
                className="bg-gold text-white px-6 py-2 rounded-xl hover:bg-gold-dark text-sm font-medium disabled:opacity-50">
                {saving ? 'Збереження...' : 'Зберегти'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="border border-gray-300 text-brown-mid px-6 py-2 rounded-xl hover:bg-cream text-sm font-medium">
                Скасувати
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => <div key={i} className="bg-ivory rounded-xl border h-12 animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-6">
          {CATEGORIES.map(cat => {
            const items = services.filter(s => s.category === cat)
            if (!items.length) return null
            return (
              <div key={cat} className="bg-ivory rounded-2xl border border-beige-light shadow-sm overflow-hidden">
                <div className="bg-cream border-b px-4 py-2">
                  <span className="text-xs font-semibold text-brown-light uppercase tracking-wider">{cat}</span>
                </div>
                <table className="w-full text-sm">
                  <tbody className="divide-y">
                    {items.map(s => (
                      <tr key={s.serviceId} className="hover:bg-cream">
                        <td className="px-4 py-3">
                          <p className="font-medium text-brown">{s.name}</p>
                          {s.description && <p className="text-xs text-brown-light mt-0.5 line-clamp-1">{s.description}</p>}
                        </td>
                        <td className="px-4 py-3 w-32 text-right">
                          {s.price === 0
                            ? <span className="text-xs text-green-600 font-medium">Безкоштовно</span>
                            : <span className="font-medium text-gold">${s.price}<span className="text-xs text-brown-light font-normal"> / {s.unit}</span></span>
                          }
                        </td>
                        <td className="px-4 py-3 w-28">
                          {s.includedIn && (
                            <span className="text-[10px] tracking-wide uppercase text-gold bg-gold/10 border border-gold/20 px-2 py-0.5">
                              {s.includedIn}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 w-24">
                          <div className="flex gap-3">
                            <button onClick={() => openEdit(s)} className="text-gold-dark hover:underline text-xs font-medium">Ред.</button>
                            <button onClick={() => handleDelete(s.serviceId)} disabled={deleting === s.serviceId}
                              className="text-red-600 hover:underline text-xs font-medium disabled:opacity-50">
                              {deleting === s.serviceId ? '...' : 'Вид.'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })}
          {services.length === 0 && (
            <p className="text-center text-brown-light py-8 text-sm">Немає послуг. Додайте першу.</p>
          )}
        </div>
      )}
    </div>
  )
}
