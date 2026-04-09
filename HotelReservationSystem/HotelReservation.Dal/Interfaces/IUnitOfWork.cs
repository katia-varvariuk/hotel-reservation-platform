using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HotelReservation.Dal.Interfaces
{
    public interface IUnitOfWork : IDisposable
    {
        IClientRepository Clients { get; }
        IReservationRepository Reservations { get; }
        IRoomRepository Rooms { get; }
        IPaymentRepository Payments { get; }
        IUserRepository Users { get; }
        IPriceRuleRepository PriceRules { get; }
        IPriceHistoryRepository PriceHistories { get; }
        IReviewRepository Reviews { get; }
        IFavoriteRepository Favorites { get; }

        Task BeginTransactionAsync(CancellationToken cancellationToken = default);
        Task CommitAsync(CancellationToken cancellationToken = default);
        Task RollbackAsync(CancellationToken cancellationToken = default);
        Task SaveChangesAsync(CancellationToken cancellationToken = default);
    }
}