using HotelReservation.Domain.Entities;

namespace HotelReservation.Dal.Interfaces
{
    public interface IFavoriteRepository
    {
        Task<IEnumerable<int>> GetRoomIdsByClientAsync(int clientId, CancellationToken cancellationToken = default);
        Task<bool> ExistsAsync(int clientId, int roomId, CancellationToken cancellationToken = default);
        Task AddAsync(int clientId, int roomId, CancellationToken cancellationToken = default);
        Task RemoveAsync(int clientId, int roomId, CancellationToken cancellationToken = default);
    }
}
