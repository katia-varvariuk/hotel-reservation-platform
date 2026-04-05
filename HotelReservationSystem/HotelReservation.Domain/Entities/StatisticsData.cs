namespace HotelReservation.Domain.Entities
{
    public class StatisticsData
    {
        public int TotalRooms { get; set; }
        public int AvailableRoomsToday { get; set; }
        public double OccupancyRateToday { get; set; }
        public int TotalReservations { get; set; }
        public int ActiveReservations { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal RevenueThisMonth { get; set; }
        public int NewClientsThisMonth { get; set; }
        public Dictionary<string, int> ReservationsByStatus { get; set; } = new();
        public List<MonthlyRevenue> MonthlyRevenue { get; set; } = new();
        public List<RecentReservationItem> RecentReservations { get; set; } = new();
        public List<TopRoomItem> TopRooms { get; set; } = new();
    }

    public class MonthlyRevenue
    {
        public string Month { get; set; } = string.Empty;
        public decimal Revenue { get; set; }
        public int Count { get; set; }
    }

    public class RecentReservationItem
    {
        public int ReservationId { get; set; }
        public string? ClientName { get; set; }
        public string? RoomNumber { get; set; }
        public DateTime CheckInDate { get; set; }
        public DateTime CheckOutDate { get; set; }
        public decimal TotalPrice { get; set; }
        public string Status { get; set; } = string.Empty;
    }

    public class TopRoomItem
    {
        public string? RoomNumber { get; set; }
        public string? RoomType { get; set; }
        public int BookingCount { get; set; }
        public decimal TotalRevenue { get; set; }
    }
}
