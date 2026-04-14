using System.ComponentModel.DataAnnotations;

namespace HotelReservation.Bll.DTOs
{
    public class RegisterDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        public string Password { get; set; } = string.Empty;

        [Required]
        public string FullName { get; set; } = string.Empty;

        [Required]
        public string Phone { get; set; } = string.Empty;

        public string PassportData { get; set; } = string.Empty;

        public string? AdminSecret { get; set; }
    }
}
