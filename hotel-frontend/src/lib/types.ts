export type UserRole = 'Client' | 'Admin'

export interface AuthResponse {
  token: string
  email: string
  role: UserRole
  userId: number
  clientId: number | null
  expiresAt: string
}

export interface MeResponse {
  userId: number
  email: string
  role: UserRole
  clientId: number | null
}

export interface Amenity {
  amenityId: number
  name: string
  icon: string
}

export interface Room {
  roomId: number
  roomNumber: string
  capacity: number
  price: number
  roomType: string
  status: string
  description: string | null
  photoUrl: string | null
  averageRating?: number
  reviewCount?: number
  amenities?: Amenity[]
}

export interface AvailableRoom extends Room {
  isAvailable: boolean
  calculatedPrice: number | null
  nights: number | null
}

export interface Reservation {
  reservationId: number
  clientId: number
  roomId: number
  roomNumber: string | null
  clientName: string | null
  clientLoyaltyTier: string | null
  checkInDate: string
  checkOutDate: string
  totalPrice: number
  status: string
}

export interface Payment {
  paymentId: number
  reservationId: number
  amount: number
  paymentDate: string
  method: string
}

export interface PriceSummary {
  roomId: number
  roomNumber: string
  baseNightlyPrice: number
  seasonCoefficient: number
  occupancyCoefficient: number
  dayOfWeekCoefficient: number
  durationCoefficient: number
  finalNightlyPrice: number
  nights: number
  totalPrice: number
  appliedRules: string[]
}

export interface PriceRule {
  priceRuleId: number
  ruleType: string
  seasonMonthFrom: number | null
  seasonMonthTo: number | null
  applicableDayOfWeek: number | null
  occupancyThresholdPercent: number | null
  minDurationDays: number | null
  coefficient: number
  isActive: boolean
}

export interface MonthlyRevenue { month: string; revenue: number; count: number }
export interface RecentReservationItem {
  reservationId: number; clientName: string | null; roomNumber: string | null
  checkInDate: string; checkOutDate: string; totalPrice: number; status: string
}
export interface TopRoomItem { roomNumber: string | null; roomType: string | null; bookingCount: number; totalRevenue: number }

export interface Statistics {
  totalRooms: number
  availableRoomsToday: number
  occupancyRateToday: number
  totalReservations: number
  activeReservations: number
  totalRevenue: number
  revenueThisMonth: number
  newClientsThisMonth: number
  reservationsByStatus: Record<string, number>
  monthlyRevenue: MonthlyRevenue[]
  recentReservations: RecentReservationItem[]
  topRooms: TopRoomItem[]
}

export interface Client {
  clientId: number
  fullName: string
  email: string
  phone: string | null
  passportData: string | null
  createdAt: string
  avatarUrl: string | null
}

export interface ReviewDto {
  reviewId: number
  clientId: number
  roomId: number
  rating: number
  comment: string | null
  createdAt: string
  clientName: string | null
  avatarUrl: string | null
  roomNumber: string | null
}

export interface UserAdminDto {
  userId: number
  email: string
  role: string
  clientId: number | null
  clientName: string | null
  createdAt: string
  isBlocked: boolean
  loyaltyTier: string | null
  completedStays: number
}
