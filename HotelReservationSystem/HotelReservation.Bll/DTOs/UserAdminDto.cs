namespace HotelReservation.Bll.DTOs
{
    public class UserAdminDto
    {
        public int UserId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public int? ClientId { get; set; }
        public string? ClientName { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsBlocked { get; set; }
        public string? LoyaltyTier { get; set; }
        public int CompletedStays { get; set; }
    }
}
