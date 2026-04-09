using HotelReservation.Domain.Entities;

namespace HotelReservation.Dal.Interfaces
{
    public interface IStatisticsRepository
    {
        Task<StatisticsData> GetAsync(CancellationToken cancellationToken = default);
    }
}
