'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { AuthResponse } from '@/lib/types'

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post<AuthResponse>('/api/auth/login', { email, password })
      const { token, userId, role, clientId } = res.data
      login(token, { userId, email, role, clientId })
      router.push(role === 'Admin' ? '/admin' : '/')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || 'Невірний email або пароль')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 bg-cream">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-gold rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
              <path d="M3 9.5L12 3l9 6.5V21a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
              <path d="M9 22V12h6v10" fill="white" opacity="0.7"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-brown">Вхід до ARIA Hotel</h1>
          <p className="text-sm text-brown-light mt-1">Введіть ваші дані для входу</p>
        </div>

        <div className="bg-ivory rounded-2xl shadow-sm border border-beige p-7">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brown-mid mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border border-beige rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brown-mid mb-1.5">Пароль</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full border border-beige rounded-xl px-3 py-2.5 pr-20 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brown-light hover:text-brown-mid text-xs select-none"
                >
                  {showPassword ? 'Сховати' : 'Показати'}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gold text-white py-2.5 rounded-xl hover:bg-gold-dark font-semibold text-sm disabled:opacity-50 transition-colors shadow-sm mt-1"
            >
              {loading ? 'Вхід...' : 'Увійти'}
            </button>
          </form>

          <p className="text-center text-sm text-brown-light mt-5">
            Немає акаунту?{' '}
            <Link href="/auth/register" className="text-gold-dark hover:text-gold-dark font-semibold">
              Зареєструватись
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
