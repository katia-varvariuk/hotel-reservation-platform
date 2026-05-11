'use client'

import { useState, useEffect, FormEvent } from 'react'
import api from '@/lib/api'
import { Amenity, Room } from '@/lib/types'

const EMPTY_FORM = {
  roomNumber: '',
  capacity: '',
  price: '',
  roomType: 'Standard',
  status: 'Available',
  description: '',
  photoUrl: '',
}

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [editing, setEditing] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [photoUploading, setPhotoUploading] = useState(false)

  const [allAmenities, setAllAmenities] = useState<Amenity[]>([])
  const [selectedAmenityIds, setSelectedAmenityIds] = useState<number[]>([])

  const load = async () => {
    try {
      const [roomsRes, amenitiesRes] = await Promise.all([
        api.get<Room[]>('/api/rooms'),
        api.get<Amenity[]>('/api/amenities'),
      ])
      setRooms(roomsRes.data)
      setAllAmenities(amenitiesRes.data)
    } catch {
      setError('Не вдалося завантажити дані')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openEdit = async (room: Room) => {
    setForm({
      roomNumber: room.roomNumber.toString(),
      capacity: room.capacity.toString(),
      price: room.price.toString(),
      roomType: room.roomType ?? 'Standard',
      status: room.status ?? 'Available',
      description: room.description ?? '',
      photoUrl: room.photoUrl ?? '',
    })
    setEditing(room.roomId)
    setShowForm(true)
    try {
      const res = await api.get<Amenity[]>(`/api/amenities/room/${room.roomId}`)
      setSelectedAmenityIds(res.data.map(a => a.amenityId))
    } catch {
      setSelectedAmenityIds([])
    }
  }

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setEditing(null)
    setSelectedAmenityIds([])
    setShowForm(true)
  }

  const toggleAmenity = (id: number) => {
    setSelectedAmenityIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    const payload = {
      roomId: editing ?? 0,
      roomNumber: form.roomNumber,
      capacity: Number(form.capacity),
      price: Number(form.price),
      roomType: form.roomType,
      status: form.status,
      description: form.description || null,
      photoUrl: form.photoUrl || null,
    }
    try {
      let roomId = editing
      if (editing != null) {
        await api.put(`/api/rooms/${editing}`, payload)
      } else {
        const res = await api.post<Room>('/api/rooms', payload)
        roomId = res.data.roomId
      }
      await api.put(`/api/amenities/room/${roomId}`, { amenityIds: selectedAmenityIds })
      setShowForm(false)
      await load()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || 'Помилка збереження')
    } finally {
      setSaving(false)
    }
  }

  const uploadPhoto = async (file: File) => {
    setPhotoUploading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('photo', file)
      const res = await api.post<{ photoUrl: string }>('/api/rooms/photo/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setForm(f => ({ ...f, photoUrl: res.data.photoUrl }))
    } catch {
      setError('Не вдалося завантажити фото')
    } finally {
      setPhotoUploading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Видалити номер?')) return
    setDeleting(id)
    try {
      await api.delete(`/api/rooms/${id}`)
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
        <h1 className="text-2xl font-bold text-brown">Управління номерами</h1>
        <button
          onClick={openCreate}
          className="bg-gold text-white px-4 py-2 rounded-xl hover:bg-gold-dark text-sm font-medium"
        >
          + Додати номер
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
            {editing != null ? 'Редагувати номер' : 'Новий номер'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-brown-light mb-1">Номер кімнати *</label>
              <input required type="text" value={form.roomNumber}
                onChange={e => setForm(f => ({ ...f, roomNumber: e.target.value }))}
                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
                placeholder="101" />
            </div>
            <div>
              <label className="block text-xs font-medium text-brown-light mb-1">Місткість *</label>
              <input required type="number" min={1} value={form.capacity}
                onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))}
                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
            </div>
            <div>
              <label className="block text-xs font-medium text-brown-light mb-1">Ціна/ніч *</label>
              <input required type="number" min={0} step={0.01} value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
            </div>
            <div>
              <label className="block text-xs font-medium text-brown-light mb-1">Тип</label>
              <select value={form.roomType} onChange={e => setForm(f => ({ ...f, roomType: e.target.value }))}
                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold">
                <option value="Standard">Standard</option>
                <option value="Deluxe">Deluxe</option>
                <option value="Suite">Suite</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-brown-light mb-1">Статус</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold">
                <option value="Available">Available</option>
                <option value="UnderRepair">UnderRepair</option>
              </select>
            </div>
            <div className="col-span-2 md:col-span-3">
              <label className="block text-xs font-medium text-brown-light mb-1">Опис</label>
              <textarea value={form.description} rows={2}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
                placeholder="Опис номеру..." />
            </div>
            <div className="col-span-2 md:col-span-3">
              <label className="block text-xs font-medium text-brown-light mb-1">Фото кімнати</label>
              <div className="flex gap-3 items-start">
                <div className="w-24 h-16 rounded-xl border bg-cream flex items-center justify-center overflow-hidden shrink-0 text-2xl text-slate-300">
                  {form.photoUrl
                    ? <img src={form.photoUrl} alt="" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                    : '🏨'}
                </div>
                <div className="flex-1 space-y-2">
                  <label className={`cursor-pointer inline-block border rounded-xl px-3 py-1.5 text-xs text-brown-mid hover:bg-cream ${photoUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                    {photoUploading ? 'Завантаження...' : 'Завантажити файл'}
                    <input type="file" accept="image/*" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) uploadPhoto(f) }} />
                  </label>
                  <input type="url" value={form.photoUrl}
                    onChange={e => setForm(f => ({ ...f, photoUrl: e.target.value }))}
                    className="w-full border rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-gold"
                    placeholder="або вставте URL: https://..." />
                </div>
              </div>
            </div>
            {allAmenities.length > 0 && (
              <div className="col-span-2 md:col-span-3">
                <label className="block text-xs font-medium text-brown-light mb-2">Зручності</label>
                <div className="flex flex-wrap gap-2">
                  {allAmenities.map(a => (
                    <button
                      key={a.amenityId}
                      type="button"
                      onClick={() => toggleAmenity(a.amenityId)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                        selectedAmenityIds.includes(a.amenityId)
                          ? 'bg-gold text-white border-gold'
                          : 'bg-white text-brown-mid border-gray-200 hover:border-gold'
                      }`}
                    >
                      <span>{a.icon}</span>
                      <span>{a.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

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
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="bg-ivory rounded-xl border h-16 animate-pulse" />)}
        </div>
      ) : (
        <div className="bg-ivory rounded-2xl border border-beige-light shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream border-b">
              <tr>
                {['photo', 'Номер', 'Місць', 'Тип', 'Статус', 'Ціна/ніч', 'actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-brown-light uppercase">{['photo','actions'].includes(h) ? '' : h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {rooms.map(room => (
                <tr key={room.roomId} className="hover:bg-cream">
                  <td className="px-3 py-2 w-12">
                    {room.photoUrl
                      ? <img src={room.photoUrl} alt="" className="w-10 h-8 object-cover rounded" onError={e => (e.currentTarget.style.display = 'none')} />
                      : <div className="w-10 h-8 bg-beige-light rounded flex items-center justify-center text-slate-300 text-sm">🏨</div>}
                  </td>
                  <td className="px-4 py-3 font-medium">{room.roomNumber}</td>
                  <td className="px-4 py-3 text-brown-mid">{room.capacity}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-cream text-gold-dark">{room.roomType}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${room.status === 'Available' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
                      {room.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">${room.price}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button onClick={() => openEdit(room)} className="text-gold-dark hover:underline text-xs font-medium">Ред.</button>
                      <button onClick={() => handleDelete(room.roomId)} disabled={deleting === room.roomId}
                        className="text-red-600 hover:underline text-xs font-medium disabled:opacity-50">
                        {deleting === room.roomId ? '...' : 'Вид.'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rooms.length === 0 && (
            <p className="text-center text-brown-light py-8">Немає номерів</p>
          )}
        </div>
      )}
    </div>
  )
}
