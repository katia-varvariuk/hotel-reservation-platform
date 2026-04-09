using HotelReservation.Domain.Entities;

namespace HotelReservation.Dal.Interfaces
{
    public interface IReviewRepository
    {
        Task<IEnumerable<Review>> GetByRoomIdAsync(int roomId, CancellationToken cancellationToken = default);
        Task<Review?> GetByClientAndRoomAsync(int clientId, int roomId, CancellationToken cancellationToken = default);
        Task<int> CreateAsync(Review review, CancellationToken cancellationToken = default);
        Task<bool> UpdateAsync(Review review, CancellationToken cancellationToken = default);
        Task<bool> AdminUpdateAsync(int reviewId, int rating, string? comment, CancellationToken cancellationToken = default);
        Task<IEnumerable<Review>> GetAllAsync(CancellationToken cancellationToken = default);
        Task<bool> DeleteAsync(int reviewId, CancellationToken cancellationToken = default);
        Task<(double Average, int Count)> GetRatingStatsAsync(int roomId, CancellationToken cancellationToken = default);
    }
}
