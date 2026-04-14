using System.ComponentModel.DataAnnotations;

namespace HotelReservation.Bll.DTOs
{
    public class PriceRuleDto
    {
        public int PriceRuleId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string RuleType { get; set; } = string.Empty;
        public int? SeasonMonthFrom { get; set; }
        public int? SeasonMonthTo { get; set; }
        public int? ApplicableDayOfWeek { get; set; }
        public double? OccupancyThresholdPercent { get; set; }
        public int? MinDurationDays { get; set; }
        public decimal Coefficient { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreatePriceRuleDto
    {
        [StringLength(200)]
        public string Name { get; set; } = string.Empty;

        [Required]
        public string RuleType { get; set; } = string.Empty;

        [Range(1, 12)] public int? SeasonMonthFrom { get; set; }
        [Range(1, 12)] public int? SeasonMonthTo { get; set; }
        [Range(0, 6)]  public int? ApplicableDayOfWeek { get; set; }
        [Range(0, 100)] public double? OccupancyThresholdPercent { get; set; }
        [Range(1, 365)] public int? MinDurationDays { get; set; }

        [Required]
        [Range(0.01, 10.0, ErrorMessage = "Coefficient must be between 0.01 and 10.0")]
        public decimal Coefficient { get; set; }

        public bool IsActive { get; set; } = true;
    }

    public class PriceSummaryDto
    {
        public int RoomId { get; set; }
        public string RoomNumber { get; set; } = string.Empty;
        public decimal BaseNightlyPrice { get; set; }
        public decimal SeasonCoefficient { get; set; }
        public decimal OccupancyCoefficient { get; set; }
        public decimal DayOfWeekCoefficient { get; set; }
        public decimal DurationCoefficient { get; set; }
        public decimal FinalNightlyPrice { get; set; }
        public int Nights { get; set; }
        public decimal TotalPrice { get; set; }
        public List<string> AppliedRules { get; set; } = new();
    }

    public class PriceHistoryDto
    {
        public int PriceHistoryId { get; set; }
        public int RoomId { get; set; }
        public decimal OldPrice { get; set; }
        public decimal NewPrice { get; set; }
        public string Reason { get; set; } = string.Empty;
        public DateTime ChangedAt { get; set; }
    }
}
