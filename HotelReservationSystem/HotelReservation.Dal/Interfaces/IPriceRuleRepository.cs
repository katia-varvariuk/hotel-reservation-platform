using HotelReservation.Domain.Entities;

namespace HotelReservation.Dal.Interfaces
{
    public interface IPriceRuleRepository
    {
        Task<PriceRule?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
        Task<IEnumerable<PriceRule>> GetAllAsync(CancellationToken cancellationToken = default);
        Task<IEnumerable<PriceRule>> GetActiveAsync(CancellationToken cancellationToken = default);
        Task<int> CreateAsync(PriceRule rule, CancellationToken cancellationToken = default);
        Task<bool> UpdateAsync(PriceRule rule, CancellationToken cancellationToken = default);
        Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);
    }
}
