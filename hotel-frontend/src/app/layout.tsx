import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import { ToastProvider } from '@/context/ToastContext'
import Navbar from '@/components/Navbar'

const inter = Inter({ subsets: ['latin', 'cyrillic'], display: 'swap', variable: '--font-inter' })
const playfair = Playfair_Display({ subsets: ['latin', 'cyrillic'], display: 'swap', variable: '--font-playfair' })

export const metadata: Metadata = {
  title: 'ARIA Hotel — Luxury Stay',
  description: 'Premium hotel booking experience',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" className="h-full">
      <body className={`${inter.variable} ${playfair.variable} font-sans min-h-full flex flex-col bg-warm-white text-brown antialiased`}>
        <AuthProvider>
          <ToastProvider>
            <Navbar />
            <main className="flex-1 pt-20">{children}</main>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
