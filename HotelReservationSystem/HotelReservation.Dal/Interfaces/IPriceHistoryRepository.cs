using HotelReservation.Domain.Entities;

namespace HotelReservation.Dal.Interfaces
{
    public interface IPriceHistoryRepository
    {
        Task<IEnumerable<PriceHistory>> GetByRoomIdAsync(int roomId, CancellationToken cancellationToken = default);
        Task<int> CreateAsync(PriceHistory history, CancellationToken cancellationToken = default);
    }
}
