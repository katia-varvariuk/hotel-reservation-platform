'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import api from '@/lib/api'

interface HotelService {
  serviceId: number
  category: string
  name: string
  description: string | null
  price: number
  unit: string | null
  includedIn: string | null
}

const CATEGORIES = ['Харчування', 'SPA & Велнес', 'Активний відпочинок', 'Додаткові послуги']

export default function ServicesPage() {
  const [services, setServices] = useState<HotelService[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<HotelService[]>('/api/services')
      .then(r => setServices(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const grouped = CATEGORIES.map(cat => ({
    category: cat,
    items: services.filter(s => s.category === cat),
  })).filter(g => g.items.length > 0)

  return (
    <>
      <div className="bg-brown py-16 px-6 -mt-20 pt-36">
        <div className="max-w-5xl mx-auto">
          <p className="text-gold text-[10px] tracking-[0.5em] uppercase mb-3">Готель</p>
          <h1 className="font-serif text-4xl md:text-5xl text-white">Послуги та ціни</h1>
          <p className="text-white/40 text-sm mt-3 max-w-lg leading-relaxed">
            Усі ціни вказані в доларах США. Деякі послуги включені у вартість номерів Делюкс та Сюїт.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-14 space-y-14">

        <div className="bg-gold/5 border border-gold/20 px-8 py-6">
          <p className="text-gold text-[10px] tracking-[0.4em] uppercase mb-4">Що включено у вартість номеру</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { type: 'Стандарт', color: 'bg-beige', desc: 'Проживання, Wi-Fi, телевізор, чай/кава у номері' },
              { type: 'Делюкс', color: 'bg-gold/10', desc: 'Все зі Стандарту + Сніданок щодня' },
              { type: 'Сюїт', color: 'bg-gold/20', desc: 'Все з Делюкс + пріоритетний чек-ін + вітальний напій' },
            ].map(t => (
              <div key={t.type} className={`${t.color} px-5 py-4`}>
                <p className="text-xs tracking-[0.3em] uppercase text-brown-mid mb-2">{t.type}</p>
                <p className="text-sm text-brown-mid leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-beige animate-pulse rounded" />)}
          </div>
        ) : (
          grouped.map(section => (
            <div key={section.category}>
              <div className="flex items-center gap-5 mb-6">
                <h2 className="font-serif text-2xl text-brown">{section.category}</h2>
                <span className="flex-1 h-px bg-beige" />
              </div>
              <div className="divide-y divide-beige border border-beige">
                {section.items.map(item => (
                  <div key={item.serviceId} className="flex items-center gap-6 px-6 py-4 bg-ivory hover:bg-cream transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-0.5">
                        <h3 className="text-sm font-medium text-brown">{item.name}</h3>
                        {item.includedIn && (
                          <span className="text-[10px] tracking-[0.2em] uppercase text-gold bg-gold/10 border border-gold/20 px-2 py-0.5 shrink-0">
                            Вкл. {item.includedIn}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-brown-light leading-relaxed">{item.description}</p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      {item.price === 0 ? (
                        <span className="text-green-600 text-sm font-medium">Безкоштовно</span>
                      ) : (
                        <>
                          <span className="font-serif text-lg text-gold">${item.price}</span>
                          {item.unit && <span className="text-xs text-brown-light ml-1">/ {item.unit}</span>}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

        <div className="text-center py-10 border-t border-beige">
          <p className="text-brown-light text-sm mb-6">Готові до незабутнього відпочинку?</p>
          <Link href="/"
            className="inline-block bg-brown text-ivory px-10 py-4 text-xs tracking-[0.4em] uppercase hover:bg-gold transition-colors duration-300">
            Обрати номер
          </Link>
        </div>
      </div>
    </>
  )
}
