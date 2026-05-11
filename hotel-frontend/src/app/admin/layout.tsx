'use client'

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/admin', label: 'Статистика', icon: (
    <svg viewBox="0 0 20 20" className="w-4 h-4 fill-current"><path d="M2 11a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-5zm6-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V7zm6-3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V4z"/></svg>
  ) },
  { href: '/admin/rooms', label: 'Номери', icon: (
    <svg viewBox="0 0 20 20" className="w-4 h-4 fill-current"><path d="M10.707 2.293a1 1 0 0 0-1.414 0l-7 7a1 1 0 0 0 1.414 1.414L4 10.414V17a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-6.586l.293.293a1 1 0 0 0 1.414-1.414l-7-7z"/></svg>
  ) },
  { href: '/admin/reservations', label: 'Бронювання', icon: (
    <svg viewBox="0 0 20 20" className="w-4 h-4 fill-current"><path fillRule="evenodd" d="M6 2a1 1 0 0 0-1 1v1H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1V3a1 1 0 1 0-2 0v1H7V3a1 1 0 0 0-1-1zm0 5a1 1 0 0 0 0 2h8a1 1 0 1 0 0-2H6z" clipRule="evenodd"/></svg>
  ) },
  { href: '/admin/pricing', label: 'Ціноутворення', icon: (
    <svg viewBox="0 0 20 20" className="w-4 h-4 fill-current"><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 0 1-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 0 1-.567.267z"/><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm1-13a1 1 0 1 0-2 0v.092a4.535 4.535 0 0 0-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 1 0-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 1 0 2 0v-.092a4.535 4.535 0 0 0 1.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0 0 11 9.092V7.151c.391.127.68.317.843.504a1 1 0 1 0 1.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/></svg>
  ) },
  { href: '/admin/users', label: 'Користувачі', icon: (
    <svg viewBox="0 0 20 20" className="w-4 h-4 fill-current"><path d="M9 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM17 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 0 0-1.5-4.33A5 5 0 0 1 19 16v1h-6.07zM6 11a5 5 0 0 1 5 5v1H1v-1a5 5 0 0 1 5-5z"/></svg>
  ) },
  { href: '/admin/calendar', label: 'Календар', icon: (
    <svg viewBox="0 0 20 20" className="w-4 h-4 fill-current"><path fillRule="evenodd" d="M6 2a1 1 0 0 0-1 1v1H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1V3a1 1 0 1 0-2 0v1H7V3a1 1 0 0 0-1-1zM4 8h12v8H4V8z" clipRule="evenodd"/></svg>
  ) },
  { href: '/admin/amenities', label: 'Зручності', icon: (
    <svg viewBox="0 0 20 20" className="w-4 h-4 fill-current"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 0 0 .464-1.455 3.066 3.066 0 0 0-2.931 3.104c0 .6.173 1.16.47 1.632A3.06 3.06 0 0 0 2 9c0 1.162.646 2.175 1.6 2.714A3.066 3.066 0 0 0 5 15a3.066 3.066 0 0 0 2.732-1.679A3.066 3.066 0 0 0 10 14a3.066 3.066 0 0 0 2.268-1.679A3.066 3.066 0 0 0 15 15a3.066 3.066 0 0 0 1.4-3.286A3.066 3.066 0 0 0 18 9a3.06 3.06 0 0 0-2.267-2.968 3.066 3.066 0 0 0 .467-1.632A3.066 3.066 0 0 0 13.27 1a3.066 3.066 0 0 0-.463 1.455A3.066 3.066 0 0 0 10 1a3.066 3.066 0 0 0-3.268 2.455zM10 5a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-4 3a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-4 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" clipRule="evenodd"/></svg>
  ) },
  { href: '/admin/services', label: 'Послуги', icon: (
    <svg viewBox="0 0 20 20" className="w-4 h-4 fill-current"><path fillRule="evenodd" d="M3 4a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1zm0 4a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1zm0 4a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1zm0 4a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1z" clipRule="evenodd"/></svg>
  ) },
  { href: '/admin/reviews', label: 'Відгуки', icon: (
    <svg viewBox="0 0 20 20" className="w-4 h-4 fill-current"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 0 1-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd"/></svg>
  ) },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading && !isAdmin) router.replace('/')
  }, [isAdmin, isLoading, router])

  if (isLoading || !isAdmin) return null

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <aside className="w-56 bg-white border-r border-beige shrink-0">
        <div className="p-4">
          <p className="text-xs font-semibold text-brown-light uppercase tracking-wider mb-3 px-3">Адміністрування</p>
          <nav className="space-y-0.5">
            {navItems.map(item => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-cream text-gold-dark'
                      : 'text-brown-mid hover:bg-cream hover:text-brown'
                  }`}
                >
                  <span className={isActive ? 'text-gold' : 'text-brown-light'}>{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </aside>
      <div className="flex-1 overflow-auto p-6">{children}</div>
    </div>
  )
}
