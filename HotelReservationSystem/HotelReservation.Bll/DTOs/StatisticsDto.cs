namespace HotelReservation.Bll.DTOs
{
    public class StatisticsDto
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
    }
}
