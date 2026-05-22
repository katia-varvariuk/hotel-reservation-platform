'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function Navbar() {
  const { user, logout, isAdmin, isClient } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleLogout = () => { logout(); router.push('/') }

  const isHome = pathname === '/'
  const transparent = isHome && !scrolled

  const displayName = user
    ? (user.fullName || user.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))
    : ''

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      transparent
        ? 'bg-transparent'
        : 'bg-warm-white/95 backdrop-blur-md border-b border-beige/40 shadow-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex flex-col leading-none gap-0.5 shrink-0">
          <span className={`font-serif text-2xl tracking-wider leading-none transition-colors ${transparent ? 'text-white' : 'text-brown'}`}>
            ARIA
          </span>
          <span className={`text-[10px] tracking-[0.45em] uppercase font-light transition-colors ${transparent ? 'text-gold-light' : 'text-gold'}`}>
            Hotel
          </span>
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-8">
          <div className="hidden md:flex items-center gap-7">
            <NavLink href="/" label="Номери" transparent={transparent} pathname={pathname} extraMatch={p => p === '/' || p.startsWith('/rooms')} />
            {!isAdmin && <NavLink href="/services" label="Послуги" transparent={transparent} pathname={pathname} extraMatch={p => p.startsWith('/services')} />}
            {isClient && <NavLink href="/bookings" label="Бронювання" transparent={transparent} pathname={pathname} extraMatch={p => p.startsWith('/bookings')} />}
            {user && <NavLink href="/profile" label="Профіль" transparent={transparent} pathname={pathname} extraMatch={p => p.startsWith('/profile')} />}
            {isAdmin && <NavLink href="/admin" label="Адмін-панель" transparent={transparent} pathname={pathname} extraMatch={p => p.startsWith('/admin')} />}
          </div>

          {/* Auth */}
          {user ? (
            <div className={`flex items-center gap-4 pl-6 border-l transition-colors ${transparent ? 'border-white/20' : 'border-beige'}`}>
              <Link href="/profile" className="hidden sm:flex items-center gap-3 group">
                <div className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-xs font-semibold tracking-wide shrink-0 ring-2 ring-transparent group-hover:ring-gold/50 transition-all ${
                  isAdmin ? 'bg-gold text-ivory' : transparent ? 'bg-white/20 text-white' : 'bg-brown text-ivory'
                }`}>
                  {user.avatarUrl
                    ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                    : user.email[0].toUpperCase()}
                </div>
                <div className="text-left">
                  <p className={`text-xs font-medium leading-none mb-0.5 transition-colors group-hover:text-gold ${transparent ? 'text-white' : 'text-brown'}`}>
                    {displayName}
                  </p>
                  <span className={`text-[10px] tracking-[0.2em] uppercase ${isAdmin ? 'text-gold' : transparent ? 'text-gold-light' : 'text-gold'}`}>
                    {isAdmin ? 'Адміністратор' : 'Клієнт'}
                  </span>
                </div>
              </Link>
              <button onClick={handleLogout}
                className={`text-xs tracking-[0.2em] uppercase transition-colors ${transparent ? 'text-white/60 hover:text-white' : 'text-brown-light hover:text-brown'}`}>
                Вийти
              </button>
            </div>
          ) : (
            <div className={`flex items-center gap-4 pl-6 border-l transition-colors ${transparent ? 'border-white/20' : 'border-beige'}`}>
              <Link href="/auth/login"
                className={`text-sm tracking-wide transition-colors ${transparent ? 'text-white/70 hover:text-white' : 'text-brown-mid hover:text-brown'}`}>
                Увійти
              </Link>
              <Link href="/auth/register"
                className={`text-sm px-5 py-2 border tracking-widest uppercase text-xs transition-all duration-300 ${
                  transparent
                    ? 'border-white/40 text-white hover:bg-white/10'
                    : 'border-gold text-brown hover:bg-gold hover:text-ivory'
                }`}>
                Реєстрація
              </Link>
            </div>
          )}
        </div>

      </div>
    </nav>
  )
}

function NavLink({ href, label, transparent, pathname, extraMatch }: {
  href: string; label: string; transparent: boolean; pathname: string
  extraMatch?: (p: string) => boolean
}) {
  const isActive = extraMatch ? extraMatch(pathname) : pathname === href
  return (
    <Link href={href}
      className={`text-sm tracking-wide transition-colors relative group ${
        transparent
          ? isActive ? 'text-white' : 'text-white/65 hover:text-white'
          : isActive ? 'text-brown' : 'text-brown-mid hover:text-brown'
      }`}>
      {label}
      <span className={`absolute -bottom-0.5 left-0 h-px transition-all duration-300 bg-gold ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`} />
    </Link>
  )
}
