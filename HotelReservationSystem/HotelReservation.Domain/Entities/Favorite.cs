namespace HotelReservation.Domain.Entities
{
    public class Favorite
    {
        public int FavoriteId { get; set; }
        public int ClientId { get; set; }
        public int RoomId { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
