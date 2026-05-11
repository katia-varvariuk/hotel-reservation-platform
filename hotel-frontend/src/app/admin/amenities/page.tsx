'use client'

import { useState, useEffect, FormEvent } from 'react'
import api from '@/lib/api'
import { Amenity } from '@/lib/types'

const EMPTY_FORM = { name: '', icon: '✓' }

export default function AdminAmenitiesPage() {
  const [amenities, setAmenities] = useState<Amenity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [editing, setEditing] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)

  const load = async () => {
    try {
      const res = await api.get<Amenity[]>('/api/amenities')
      setAmenities(res.data)
    } catch {
      setError('Не вдалося завантажити зручності')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openEdit = (a: Amenity) => {
    setForm({ name: a.name, icon: a.icon })
    setEditing(a.amenityId)
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
    try {
      if (editing != null) {
        await api.put(`/api/amenities/${editing}`, form)
      } else {
        await api.post('/api/amenities', form)
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
    if (!confirm('Видалити зручність?')) return
    setDeleting(id)
    try {
      await api.delete(`/api/amenities/${id}`)
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
        <h1 className="text-2xl font-bold text-brown">Управління зручностями</h1>
        <button
          onClick={openCreate}
          className="bg-gold text-white px-4 py-2 rounded-xl hover:bg-gold-dark text-sm font-medium"
        >
          + Додати зручність
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-ivory rounded-2xl border border-beige-light shadow-sm p-5 mb-6">
          <h2 className="text-base font-semibold text-brown mb-4">
            {editing != null ? 'Редагувати зручність' : 'Нова зручність'}
          </h2>
          <form onSubmit={handleSubmit} className="flex gap-4 items-end">
            <div className="w-20">
              <label className="block text-xs font-medium text-brown-light mb-1">Іконка</label>
              <input
                type="text"
                value={form.icon}
                onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                className="w-full border rounded-xl px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-gold"
                placeholder="✓"
                maxLength={4}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-brown-light mb-1">Назва *</label>
              <input
                required
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
                placeholder="Наприклад: Wi-Fi"
                maxLength={100}
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving}
                className="bg-gold text-white px-5 py-2 rounded-xl hover:bg-gold-dark text-sm font-medium disabled:opacity-50">
                {saving ? '...' : 'Зберегти'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="border border-gray-300 text-brown-mid px-4 py-2 rounded-xl hover:bg-cream text-sm font-medium">
                Скасувати
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="bg-ivory rounded-xl border h-12 animate-pulse" />)}
        </div>
      ) : (
        <div className="bg-ivory rounded-2xl border border-beige-light shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream border-b">
              <tr>
                {['Іконка', 'Назва', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-brown-light uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {amenities.map(a => (
                <tr key={a.amenityId} className="hover:bg-cream">
                  <td className="px-4 py-3 text-xl w-16 text-center">{a.icon}</td>
                  <td className="px-4 py-3 font-medium text-brown">{a.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button onClick={() => openEdit(a)} className="text-gold-dark hover:underline text-xs font-medium">Ред.</button>
                      <button onClick={() => handleDelete(a.amenityId)} disabled={deleting === a.amenityId}
                        className="text-red-600 hover:underline text-xs font-medium disabled:opacity-50">
                        {deleting === a.amenityId ? '...' : 'Вид.'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {amenities.length === 0 && (
            <p className="text-center text-brown-light py-8 text-sm">Немає зручностей</p>
          )}
        </div>
      )}
    </div>
  )
}
