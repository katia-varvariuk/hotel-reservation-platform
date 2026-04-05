namespace HotelReservation.Domain.Entities
{
    public enum PriceRuleType { Season, DayOfWeek, Occupancy, Duration }

    public class PriceRule
    {
        public int PriceRuleId { get; set; }
        public string Name { get; set; } = string.Empty;
        public PriceRuleType RuleType { get; set; }

        // Season: applies when checkIn month is in [MonthFrom, MonthTo]
        public int? SeasonMonthFrom { get; set; }
        public int? SeasonMonthTo { get; set; }

        // DayOfWeek: 0=Sunday .. 6=Saturday
        public int? ApplicableDayOfWeek { get; set; }

        // Occupancy: applies when hotel occupancy % >= threshold
        public double? OccupancyThresholdPercent { get; set; }

        // Duration: applies when stay nights >= MinDurationDays (typically discount < 1)
        public int? MinDurationDays { get; set; }

        public decimal Coefficient { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; }
    }
}
