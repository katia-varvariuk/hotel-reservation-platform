using System.ComponentModel.DataAnnotations;

namespace HotelReservation.Bll.DTOs
{
    public class HotelServiceDto
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

    public class CreateHotelServiceDto
    {
        [Required] [StringLength(100)] public string Category { get; set; } = string.Empty;
        [Required] [StringLength(200)] public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        [Range(0, double.MaxValue)] public decimal Price { get; set; }
        [StringLength(50)] public string? Unit { get; set; }
        [StringLength(100)] public string? IncludedIn { get; set; }
        public int SortOrder { get; set; }
    }
}
