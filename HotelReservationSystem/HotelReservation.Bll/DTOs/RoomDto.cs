using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using System.ComponentModel.DataAnnotations;

namespace HotelReservation.Bll.DTOs
{
    public class RoomDto
    {
        public int RoomId { get; set; }

        [Required(ErrorMessage = "Room number is required")]
        [StringLength(10, ErrorMessage = "Room number cannot exceed 10 characters")]
        public string RoomNumber { get; set; } = string.Empty;

        [Range(1, 10, ErrorMessage = "Capacity must be between 1 and 10")]
        public int Capacity { get; set; }

        [Range(0.01, double.MaxValue, ErrorMessage = "Price must be greater than 0")]
        public decimal Price { get; set; }

        public string RoomType { get; set; } = "Standard";
        public string Status { get; set; } = "Available";
        public string? Description { get; set; }
        public string? PhotoUrl { get; set; }
        public double? AverageRating { get; set; }
        public int ReviewCount { get; set; }
        public List<AmenityDto> Amenities { get; set; } = new();
    }

    public class CreateRoomDto
    {
        [Required(ErrorMessage = "Room number is required")]
        [StringLength(10, ErrorMessage = "Room number cannot exceed 10 characters")]
        public string RoomNumber { get; set; } = string.Empty;

        [Range(1, 10, ErrorMessage = "Capacity must be between 1 and 10")]
        public int Capacity { get; set; }

        [Range(0.01, double.MaxValue, ErrorMessage = "Price must be greater than 0")]
        public decimal Price { get; set; }

        public string RoomType { get; set; } = "Standard";
        public string Status { get; set; } = "Available";
        public string? Description { get; set; }
        public string? PhotoUrl { get; set; }
    }

    public class AvailableRoomDto : RoomDto
    {
        public bool IsAvailable { get; set; }
        public decimal? CalculatedPrice { get; set; }
        public int? Nights { get; set; }
    }
}