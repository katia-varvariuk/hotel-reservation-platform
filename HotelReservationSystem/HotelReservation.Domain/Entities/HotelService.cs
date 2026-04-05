namespace HotelReservation.Domain.Entities
{
    public class HotelService
    {
        public int ServiceId { get; set; }
        public string Category { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public string? Unit { get; set; }
        public string? IncludedIn { get; set; }
        public int SortOrder { get; set; }
    }
}
