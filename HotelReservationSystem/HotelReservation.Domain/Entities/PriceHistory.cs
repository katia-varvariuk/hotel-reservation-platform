namespace HotelReservation.Domain.Entities
{
    public class PriceHistory
    {
        public int PriceHistoryId { get; set; }
        public int RoomId { get; set; }
        public decimal OldPrice { get; set; }
        public decimal NewPrice { get; set; }
        public string Reason { get; set; } = string.Empty;
        public DateTime ChangedAt { get; set; }
    }
}
