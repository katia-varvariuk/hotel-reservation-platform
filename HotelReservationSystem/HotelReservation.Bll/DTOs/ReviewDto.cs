using System.ComponentModel.DataAnnotations;

namespace HotelReservation.Bll.DTOs
{
    public class ReviewDto
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

    public class CreateReviewDto
    {
        [Required]
        public int RoomId { get; set; }

        [Required]
        [Range(1, 5)]
        public int Rating { get; set; }

        [StringLength(1000)]
        public string? Comment { get; set; }
    }

    public class UpdateReviewDto
    {
        [Required]
        [Range(1, 5)]
        public int Rating { get; set; }

        [StringLength(1000)]
        public string? Comment { get; set; }
    }
}
