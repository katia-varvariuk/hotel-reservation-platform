'use client'

import { useState, useEffect, FormEvent } from 'react'
import api from '@/lib/api'
import { PriceRule } from '@/lib/types'

const TYPE_LABELS: Record<string, string> = {
  Season: 'Сезонна',
  DayOfWeek: 'День тижня',
  Occupancy: 'Заповненість',
  Duration: 'Тривалість',
}

const DAYS = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

const EMPTY_FORM = {
  ruleType: 'Season',
  coefficient: '1.2',
  isActive: true,
  seasonMonthFrom: '',
  seasonMonthTo: '',
  applicableDayOfWeek: '',
  occupancyThresholdPercent: '',
  minDurationDays: '',
}

export default function AdminPricingPage() {
  const [rules, setRules] = useState<PriceRule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [editing, setEditing] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)

  const load = async () => {
    try {
      const res = await api.get<PriceRule[]>('/api/price-rules')
      setRules(res.data)
    } catch {
      setError('Не вдалося завантажити правила')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setEditing(null)
    setShowForm(true)
  }

  const openEdit = (rule: PriceRule) => {
    setForm({
      ruleType: rule.ruleType,
      coefficient: rule.coefficient.toString(),
      isActive: rule.isActive,
      seasonMonthFrom: rule.seasonMonthFrom?.toString() ?? '',
      seasonMonthTo: rule.seasonMonthTo?.toString() ?? '',
      applicableDayOfWeek: rule.applicableDayOfWeek?.toString() ?? '',
      occupancyThresholdPercent: rule.occupancyThresholdPercent?.toString() ?? '',
      minDurationDays: rule.minDurationDays?.toString() ?? '',
    })
    setEditing(rule.priceRuleId)
    setShowForm(true)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    const payload: Record<string, unknown> = {
      ruleType: form.ruleType,
      coefficient: Number(form.coefficient),
      isActive: form.isActive,
    }
    if (form.ruleType === 'Season') {
      payload.seasonMonthFrom = Number(form.seasonMonthFrom)
      payload.seasonMonthTo = Number(form.seasonMonthTo)
    } else if (form.ruleType === 'DayOfWeek') {
      payload.applicableDayOfWeek = Number(form.applicableDayOfWeek)
    } else if (form.ruleType === 'Occupancy') {
      payload.occupancyThresholdPercent = Number(form.occupancyThresholdPercent)
    } else if (form.ruleType === 'Duration') {
      payload.minDurationDays = Number(form.minDurationDays)
    }
    try {
      if (editing != null) {
        await api.put(`/api/price-rules/${editing}`, payload)
      } else {
        await api.post('/api/price-rules', payload)
      }
      setShowForm(false)
      await load()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || 'Помилка збереження')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Видалити правило?')) return
    setDeleting(id)
    try {
      await api.delete(`/api/price-rules/${id}`)
      await load()
    } catch {
      setError('Не вдалося видалити')
    } finally {
      setDeleting(null)
    }
  }

  const toggleActive = async (rule: PriceRule) => {
    try {
      await api.put(`/api/price-rules/${rule.priceRuleId}`, { ...rule, isActive: !rule.isActive })
      await load()
    } catch {
      setError('Помилка оновлення')
    }
  }

  const ruleDescription = (rule: PriceRule) => {
    if (rule.ruleType === 'Season') return `Місяці ${rule.seasonMonthFrom}–${rule.seasonMonthTo}`
    if (rule.ruleType === 'DayOfWeek') return `${DAYS[rule.applicableDayOfWeek ?? 0]}`
    if (rule.ruleType === 'Occupancy') return `≥${rule.occupancyThresholdPercent}% заповненості`
    if (rule.ruleType === 'Duration') return `≥${rule.minDurationDays} ночей`
    return ''
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-brown">Правила ціноутворення</h1>
        <button onClick={openCreate} className="bg-gold text-white px-4 py-2 rounded-xl hover:bg-gold-dark text-sm font-medium">
          + Додати правило
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
            {editing != null ? 'Редагувати правило' : 'Нове правило'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-brown-light mb-1">Тип правила</label>
                <select value={form.ruleType} onChange={e => setForm(f => ({ ...f, ruleType: e.target.value }))}
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold">
                  <option value="Season">Сезонна</option>
                  <option value="DayOfWeek">День тижня</option>
                  <option value="Occupancy">Заповненість</option>
                  <option value="Duration">Тривалість</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-brown-light mb-1">Коефіцієнт</label>
                <input required type="number" step={0.01} min={0.1} value={form.coefficient}
                  onChange={e => setForm(f => ({ ...f, coefficient: e.target.value }))}
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isActive}
                    onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                    className="w-4 h-4 rounded" />
                  <span className="text-sm text-brown-mid">Активне</span>
                </label>
              </div>
            </div>

            {form.ruleType === 'Season' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-brown-light mb-1">Місяць від (1–12)</label>
                  <input required type="number" min={1} max={12} value={form.seasonMonthFrom}
                    onChange={e => setForm(f => ({ ...f, seasonMonthFrom: e.target.value }))}
                    className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-brown-light mb-1">Місяць до (1–12)</label>
                  <input required type="number" min={1} max={12} value={form.seasonMonthTo}
                    onChange={e => setForm(f => ({ ...f, seasonMonthTo: e.target.value }))}
                    className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
                </div>
              </div>
            )}

            {form.ruleType === 'DayOfWeek' && (
              <div>
                <label className="block text-xs font-medium text-brown-light mb-1">День тижня (0=Нд...6=Сб)</label>
                <select required value={form.applicableDayOfWeek}
                  onChange={e => setForm(f => ({ ...f, applicableDayOfWeek: e.target.value }))}
                  className="w-full md:w-48 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold">
                  <option value="">Оберіть...</option>
                  {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
            )}

            {form.ruleType === 'Occupancy' && (
              <div>
                <label className="block text-xs font-medium text-brown-light mb-1">Поріг заповненості (%)</label>
                <input required type="number" min={0} max={100} value={form.occupancyThresholdPercent}
                  onChange={e => setForm(f => ({ ...f, occupancyThresholdPercent: e.target.value }))}
                  className="w-full md:w-48 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
              </div>
            )}

            {form.ruleType === 'Duration' && (
              <div>
                <label className="block text-xs font-medium text-brown-light mb-1">Мінімальна кількість ночей</label>
                <input required type="number" min={1} value={form.minDurationDays}
                  onChange={e => setForm(f => ({ ...f, minDurationDays: e.target.value }))}
                  className="w-full md:w-48 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
              </div>
            )}

            <div className="flex gap-3">
              <button type="submit" disabled={saving}
                className="bg-gold text-white px-6 py-2 rounded-xl hover:bg-gold-dark text-sm font-medium disabled:opacity-50">
                {saving ? 'Збереження...' : 'Зберегти'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="border border-slate-300 text-brown-mid px-6 py-2 rounded-xl hover:bg-cream text-sm font-medium">
                Скасувати
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="bg-ivory rounded-2xl border border-beige-light h-16 animate-pulse" />)}
        </div>
      ) : (
        <div className="bg-ivory rounded-2xl border border-beige-light shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream border-b">
              <tr>
                {['Тип', 'Умова', 'Коефіцієнт', 'Статус', 'Дії'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-brown-light uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {rules.map(rule => (
                <tr key={rule.priceRuleId} className="hover:bg-cream">
                  <td className="px-4 py-3 font-medium">{TYPE_LABELS[rule.ruleType] ?? rule.ruleType}</td>
                  <td className="px-4 py-3 text-brown-mid">{ruleDescription(rule)}</td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${rule.coefficient >= 1 ? 'text-red-600' : 'text-green-600'}`}>
                      ×{rule.coefficient.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(rule)}
                      className={`text-xs font-medium px-2.5 py-1 rounded-full cursor-pointer ${rule.isActive ? 'bg-sage/10 text-sage' : 'bg-beige-light text-brown-light'}`}>
                      {rule.isActive ? 'Активне' : 'Вимкнено'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button onClick={() => openEdit(rule)} className="text-gold-dark hover:underline text-xs font-medium">Ред.</button>
                      <button onClick={() => handleDelete(rule.priceRuleId)} disabled={deleting === rule.priceRuleId}
                        className="text-red-600 hover:underline text-xs font-medium disabled:opacity-50">
                        {deleting === rule.priceRuleId ? '...' : 'Вид.'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rules.length === 0 && (
            <p className="text-center text-brown-light py-8">Немає правил ціноутворення</p>
          )}
        </div>
      )}
    </div>
  )
}
