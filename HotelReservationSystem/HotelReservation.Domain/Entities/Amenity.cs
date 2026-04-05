namespace HotelReservation.Domain.Entities
{
    public class Amenity
    {
        public int AmenityId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Icon { get; set; } = "✓";
    }
}
