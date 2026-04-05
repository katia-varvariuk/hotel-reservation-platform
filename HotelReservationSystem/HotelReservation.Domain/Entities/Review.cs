namespace HotelReservation.Domain.Entities
{
    public class Review
    {
        public int ReviewId { get; set; }
        public int ClientId { get; set; }
        public int RoomId { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? ClientName { get; set; }
        public string? AvatarUrl { get; set; }
        public string? RoomNumber { get; set; }
    }
}
