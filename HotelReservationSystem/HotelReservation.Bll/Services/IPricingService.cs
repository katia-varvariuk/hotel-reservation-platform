using HotelReservation.Bll.DTOs;

namespace HotelReservation.Bll.Services
{
    public interface IPricingService
    {
        Task<decimal> CalculatePriceAsync(int roomId, DateTime checkIn, DateTime checkOut, CancellationToken cancellationToken = default);
        Task<PriceSummaryDto> GetPriceSummaryAsync(int roomId, DateTime checkIn, DateTime checkOut, CancellationToken cancellationToken = default);
    }
}
