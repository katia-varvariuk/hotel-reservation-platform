using Microsoft.Extensions.Logging;
using HotelReservation.Bll.DTOs;
using HotelReservation.Dal.Interfaces;
using HotelReservation.Domain.Entities;
using HotelReservation.Domain.Exceptions;

namespace HotelReservation.Bll.Services
{
    public class PricingService : IPricingService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<PricingService> _logger;

        public PricingService(IUnitOfWork unitOfWork, ILogger<PricingService> logger)
        {
            _unitOfWork = unitOfWork;
            _logger = logger;
        }

        public async Task<decimal> CalculatePriceAsync(int roomId, DateTime checkIn, DateTime checkOut,
            CancellationToken cancellationToken = default)
        {
            var summary = await GetPriceSummaryAsync(roomId, checkIn, checkOut, cancellationToken);
            return summary.TotalPrice;
        }

        public async Task<PriceSummaryDto> GetPriceSummaryAsync(int roomId, DateTime checkIn, DateTime checkOut,
            CancellationToken cancellationToken = default)
        {
            var room = await _unitOfWork.Rooms.GetByIdAsync(roomId, cancellationToken)
                ?? throw new NotFoundException($"Room with ID {roomId} not found");

            var nights = Math.Max(1, (checkOut - checkIn).Days);
            var rules = (await _unitOfWork.PriceRules.GetActiveAsync(cancellationToken)).ToList();

            var appliedRules = new List<string>();

            var seasonCoef = GetSeasonCoefficient(rules, checkIn, appliedRules);
            var occupancyCoef = await GetOccupancyCoefficient(rules, checkIn, checkOut, appliedRules, cancellationToken);
            var dayCoef = GetDayOfWeekCoefficient(rules, checkIn, appliedRules);
            var durationCoef = GetDurationCoefficient(rules, nights, appliedRules);

            var finalNightly = Math.Round(room.Price * seasonCoef * occupancyCoef * dayCoef * durationCoef, 2);
            var total = Math.Round(finalNightly * nights, 2);

            _logger.LogInformation(
                "Price calculated for room {RoomId}: base={Base}, season={S}, occupancy={O}, day={D}, duration={Dur} => {Total}",
                roomId, room.Price, seasonCoef, occupancyCoef, dayCoef, durationCoef, total);

            return new PriceSummaryDto
            {
                RoomId = roomId,
                RoomNumber = room.RoomNumber,
                BaseNightlyPrice = room.Price,
                SeasonCoefficient = seasonCoef,
                OccupancyCoefficient = occupancyCoef,
                DayOfWeekCoefficient = dayCoef,
                DurationCoefficient = durationCoef,
                FinalNightlyPrice = finalNightly,
                Nights = nights,
                TotalPrice = total,
                AppliedRules = appliedRules
            };
        }

        // Returns coefficient of the most specific matching Season rule (default 1.0)
        private static decimal GetSeasonCoefficient(List<PriceRule> rules, DateTime checkIn, List<string> applied)
        {
            var month = checkIn.Month;
            var match = rules
                .Where(r => r.RuleType == PriceRuleType.Season
                         && r.SeasonMonthFrom.HasValue && r.SeasonMonthTo.HasValue
                         && IsMonthInRange(month, r.SeasonMonthFrom.Value, r.SeasonMonthTo.Value))
                .OrderByDescending(r => r.Coefficient)
                .FirstOrDefault();

            if (match != null) applied.Add($"Season: {match.Name} (×{match.Coefficient})");
            return match?.Coefficient ?? 1m;
        }

        // Returns coefficient of the matching DayOfWeek rule for checkIn day (default 1.0)
        private static decimal GetDayOfWeekCoefficient(List<PriceRule> rules, DateTime checkIn, List<string> applied)
        {
            var dayOfWeek = (int)checkIn.DayOfWeek;
            var match = rules
                .Where(r => r.RuleType == PriceRuleType.DayOfWeek
                         && r.ApplicableDayOfWeek.HasValue
                         && r.ApplicableDayOfWeek.Value == dayOfWeek)
                .OrderByDescending(r => r.Coefficient)
                .FirstOrDefault();

            if (match != null) applied.Add($"DayOfWeek: {match.Name} (×{match.Coefficient})");
            return match?.Coefficient ?? 1m;
        }

        // Returns coefficient based on current hotel occupancy (default 1.0)
        private async Task<decimal> GetOccupancyCoefficient(List<PriceRule> rules, DateTime checkIn, DateTime checkOut,
            List<string> applied, CancellationToken ct)
        {
            var allRooms = (await _unitOfWork.Rooms.GetAllAsync(ct)).ToList();
            if (allRooms.Count == 0) return 1m;

            // Rooms that have active overlapping reservations
            var bookedRooms = (await _unitOfWork.Reservations.GetByDateRangeAsync(checkIn, checkOut, ct)).ToList();
            var uniqueBookedRoomIds = bookedRooms.Select(r => r.RoomId).Distinct().Count();

            var occupancyPercent = (double)uniqueBookedRoomIds / allRooms.Count * 100.0;

            // Pick the highest threshold that is still exceeded
            var match = rules
                .Where(r => r.RuleType == PriceRuleType.Occupancy
                         && r.OccupancyThresholdPercent.HasValue
                         && occupancyPercent >= r.OccupancyThresholdPercent.Value)
                .OrderByDescending(r => r.OccupancyThresholdPercent)
                .FirstOrDefault();

            if (match != null) applied.Add($"Occupancy {occupancyPercent:F0}%: {match.Name} (×{match.Coefficient})");
            return match?.Coefficient ?? 1m;
        }

        // Returns coefficient for long-stay discounts — highest MinDurationDays that still matches (default 1.0)
        private static decimal GetDurationCoefficient(List<PriceRule> rules, int nights, List<string> applied)
        {
            var match = rules
                .Where(r => r.RuleType == PriceRuleType.Duration
                         && r.MinDurationDays.HasValue
                         && nights >= r.MinDurationDays.Value)
                .OrderByDescending(r => r.MinDurationDays)
                .FirstOrDefault();

            if (match != null) applied.Add($"Duration {nights}n: {match.Name} (×{match.Coefficient})");
            return match?.Coefficient ?? 1m;
        }

        // Handles ranges that wrap year boundary (e.g. Dec=12 → Jan=1)
        private static bool IsMonthInRange(int month, int from, int to)
            => from <= to
                ? month >= from && month <= to
                : month >= from || month <= to;
    }
}
