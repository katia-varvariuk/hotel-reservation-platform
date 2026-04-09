using HotelReservation.Domain.Entities;

namespace HotelReservation.Dal.Interfaces
{
    public interface IUserRepository
    {
        Task<User?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
        Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);
        Task<int> CreateAsync(User user, CancellationToken cancellationToken = default);
        Task UpdatePasswordAsync(int userId, string passwordHash, CancellationToken cancellationToken = default);
        Task UpdateProfileAsync(int userId, string fullName, string? phone, string? avatarUrl, CancellationToken cancellationToken = default);
        Task<IEnumerable<User>> GetAllAsync(CancellationToken cancellationToken = default);
        Task SetBlockedAsync(int userId, bool isBlocked, CancellationToken cancellationToken = default);
    }
}
