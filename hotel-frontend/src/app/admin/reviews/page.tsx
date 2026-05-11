'use client'

import { useState, useEffect } from 'react'
import api from '@/lib/api'
import { ReviewDto } from '@/lib/types'

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(n => (
        <span key={n} className={`text-sm ${n <= rating ? 'text-yellow-400' : 'text-slate-200'}`}>★</span>
      ))}
    </div>
  )
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<(ReviewDto & { roomNumber?: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<number | null>(null)
  const [editing, setEditing] = useState<number | null>(null)
  const [editRating, setEditRating] = useState(5)
  const [editComment, setEditComment] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      const res = await api.get<(ReviewDto & { roomNumber?: string })[]>('/api/review/all')
      setReviews(res.data)
    } catch {
      setError('Не вдалося завантажити відгуки')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openEdit = (r: ReviewDto) => {
    setEditing(r.reviewId)
    setEditRating(r.rating)
    setEditComment(r.comment ?? '')
  }

  const saveEdit = async () => {
    if (!editing) return
    setSaving(true)
    try {
      await api.put(`/api/review/${editing}`, { rating: editRating, comment: editComment })
      setReviews(rs => rs.map(r => r.reviewId === editing ? { ...r, rating: editRating, comment: editComment } : r))
      setEditing(null)
    } catch {
      setError('Не вдалося зберегти')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Видалити відгук?')) return
    setDeleting(id)
    try {
      await api.delete(`/api/review/${id}`)
      setReviews(rs => rs.filter(r => r.reviewId !== id))
    } catch {
      setError('Не вдалося видалити')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brown">Модерація відгуків</h1>
        <p className="text-sm text-brown-light mt-1">{reviews.length} відгуків</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="bg-ivory rounded-xl border h-20 animate-pulse" />)}
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-center text-brown-light py-12 text-sm">Відгуків немає</p>
      ) : (
        <div className="space-y-3">
          {reviews.map(r => (
            <div key={r.reviewId} className="bg-ivory rounded-2xl border border-beige-light p-4">
              {editing === r.reviewId ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-brown-mid">
                    <span className="font-medium">{r.clientName}</span>
                    <span className="text-brown-light">·</span>
                    <span className="text-brown-light">Кімната {(r as ReviewDto & { roomNumber?: string }).roomNumber ?? r.roomId}</span>
                  </div>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(n => (
                      <button key={n} type="button" onClick={() => setEditRating(n)}
                        className={`text-xl leading-none ${n <= editRating ? 'text-yellow-400' : 'text-slate-200'} hover:text-yellow-300`}>★</button>
                    ))}
                  </div>
                  <textarea rows={2} value={editComment} onChange={e => setEditComment(e.target.value)}
                    className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold resize-none"
                    placeholder="Коментар..." />
                  <div className="flex gap-2">
                    <button onClick={saveEdit} disabled={saving}
                      className="bg-gold text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-gold-dark disabled:opacity-50">
                      {saving ? '...' : 'Зберегти'}
                    </button>
                    <button onClick={() => setEditing(null)}
                      className="border text-brown-mid px-4 py-1.5 rounded-lg text-sm hover:bg-cream">
                      Скасувати
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-full bg-cream border border-beige flex items-center justify-center text-sm font-semibold text-gold-dark shrink-0 overflow-hidden">
                    {r.avatarUrl ? <img src={r.avatarUrl} alt="" className="w-full h-full object-cover" /> : (r.clientName?.[0]?.toUpperCase() ?? '?')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-brown">{r.clientName}</span>
                      <span className="text-xs text-brown-light">· Кімната {(r as ReviewDto & { roomNumber?: string }).roomNumber ?? r.roomId}</span>
                      <span className="text-xs text-brown-light">· {new Date(r.createdAt).toLocaleDateString('uk-UA')}</span>
                    </div>
                    <Stars rating={r.rating} />
                    {r.comment && <p className="text-sm text-brown-mid mt-1 leading-relaxed">{r.comment}</p>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => openEdit(r)} className="text-gold-dark hover:underline text-xs font-medium">Ред.</button>
                    <button onClick={() => handleDelete(r.reviewId)} disabled={deleting === r.reviewId}
                      className="text-red-600 hover:underline text-xs font-medium disabled:opacity-50">
                      {deleting === r.reviewId ? '...' : 'Вид.'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
