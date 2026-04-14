using System.ComponentModel.DataAnnotations;

namespace HotelReservation.Bll.DTOs
{
    public class AmenityDto
    {
        public int AmenityId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Icon { get; set; } = "✓";
    }

    public class CreateAmenityDto
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [StringLength(10)]
        public string Icon { get; set; } = "✓";
    }

    public class SetRoomAmenitiesDto
    {
        public List<int> AmenityIds { get; set; } = new();
    }
}
