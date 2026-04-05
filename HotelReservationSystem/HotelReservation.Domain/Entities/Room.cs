namespace HotelReservation.Domain.Entities
{
    public enum RoomType { Standard, Deluxe, Suite }
    public enum RoomStatus { Available, UnderRepair }

    public class Room
    {
        public int RoomId { get; set; }
        public string RoomNumber { get; set; } = string.Empty;
        public int Capacity { get; set; }
        public decimal Price { get; set; }
        public RoomType RoomType { get; set; } = RoomType.Standard;
        public RoomStatus Status { get; set; } = RoomStatus.Available;
        public string? Description { get; set; }
        public string? PhotoUrl { get; set; }

        public ICollection<Reservation> Reservations { get; set; } = new List<Reservation>();
    }
}
