'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { AuthResponse } from '@/lib/types'

export default function RegisterPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post<AuthResponse>('/api/auth/register', {
        email, password, fullName: `${firstName} ${lastName}`.trim(), phone,
      })
      const { token, userId, role, clientId } = res.data
      login(token, { userId, email, role, clientId })
      router.push('/')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || 'Помилка реєстрації')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = "w-full border border-beige rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-8 bg-cream">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-gold rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
              <path d="M3 9.5L12 3l9 6.5V21a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
              <path d="M9 22V12h6v10" fill="white" opacity="0.7"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-brown">Реєстрація</h1>
          <p className="text-sm text-brown-light mt-1">Створіть свій акаунт безкоштовно</p>
        </div>

        <div className="bg-ivory rounded-2xl shadow-sm border border-beige p-7">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-brown-mid mb-1.5">Ім&apos;я</label>
                <input type="text" required value={firstName} onChange={e => setFirstName(e.target.value)} className={inputCls} placeholder="Іван" />
              </div>
              <div>
                <label className="block text-sm font-medium text-brown-mid mb-1.5">Прізвище</label>
                <input type="text" required value={lastName} onChange={e => setLastName(e.target.value)} className={inputCls} placeholder="Петренко" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-brown-mid mb-1.5">Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className={inputCls} placeholder="your@email.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-brown-mid mb-1.5">Телефон</label>
              <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} className={inputCls} placeholder="+380..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-brown-mid mb-1.5">Пароль</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full border border-beige rounded-xl px-3 py-2.5 pr-20 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                  placeholder="Мінімум 6 символів"
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brown-light hover:text-brown-mid text-xs select-none">
                  {showPassword ? 'Сховати' : 'Показати'}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-gold text-white py-2.5 rounded-xl hover:bg-gold-dark font-semibold text-sm disabled:opacity-50 transition-colors shadow-sm mt-1">
              {loading ? 'Реєстрація...' : 'Зареєструватись'}
            </button>
          </form>

          <p className="text-center text-sm text-brown-light mt-5">
            Вже є акаунт?{' '}
            <Link href="/auth/login" className="text-gold-dark hover:text-gold-dark font-semibold">
              Увійти
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
