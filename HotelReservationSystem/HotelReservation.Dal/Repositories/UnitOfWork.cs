using System.Data;
using Npgsql;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using HotelReservation.Dal.Interfaces;

namespace HotelReservation.Dal.Repositories
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly IConfiguration _configuration;
        private readonly IClientRepository _clients;
        private readonly IReservationRepository _reservations;
        private readonly IRoomRepository _rooms;
        private readonly IPaymentRepository _payments;
        private readonly IUserRepository _users;
        private readonly IPriceRuleRepository _priceRules;
        private readonly IPriceHistoryRepository _priceHistories;
        private readonly IReviewRepository _reviews;
        private readonly IFavoriteRepository _favorites;

        private NpgsqlConnection? _connection;
        private NpgsqlTransaction? _transaction;
        private bool _disposed;

        public UnitOfWork(
            IConfiguration configuration,
            IClientRepository clientRepository,
            IReservationRepository reservationRepository,
            IRoomRepository roomRepository,
            IPaymentRepository paymentRepository,
            IUserRepository userRepository,
            IPriceRuleRepository priceRuleRepository,
            IPriceHistoryRepository priceHistoryRepository,
            IReviewRepository reviewRepository,
            IFavoriteRepository favoriteRepository)
        {
            _configuration = configuration;
            _clients = clientRepository;
            _reservations = reservationRepository;
            _rooms = roomRepository;
            _payments = paymentRepository;
            _users = userRepository;
            _priceRules = priceRuleRepository;
            _priceHistories = priceHistoryRepository;
            _reviews = reviewRepository;
            _favorites = favoriteRepository;
        }

        public IClientRepository Clients => _clients;
        public IReservationRepository Reservations => _reservations;
        public IRoomRepository Rooms => _rooms;
        public IPaymentRepository Payments => _payments;
        public IUserRepository Users => _users;
        public IPriceRuleRepository PriceRules => _priceRules;
        public IPriceHistoryRepository PriceHistories => _priceHistories;
        public IReviewRepository Reviews => _reviews;
        public IFavoriteRepository Favorites => _favorites;

        public async Task BeginTransactionAsync(CancellationToken cancellationToken = default)
        {
            if (_transaction != null)
            {
                throw new InvalidOperationException("Transaction already started");
            }

            var connectionString = _configuration.GetConnectionString("HotelReservationsDB") ??
                throw new ArgumentNullException("Connection string not found");

            _connection = new NpgsqlConnection(connectionString);
            await _connection.OpenAsync(cancellationToken);
            _transaction = await _connection.BeginTransactionAsync(cancellationToken);
        }

        public async Task CommitAsync(CancellationToken cancellationToken = default)
        {
            if (_transaction == null)
            {
                throw new InvalidOperationException("No transaction to commit");
            }

            try
            {
                await _transaction.CommitAsync(cancellationToken);
            }
            catch
            {
                await RollbackAsync(cancellationToken);
                throw;
            }
            finally
            {
                await _transaction.DisposeAsync();
                _transaction = null;

                if (_connection != null)
                {
                    await _connection.CloseAsync();
                    await _connection.DisposeAsync();
                    _connection = null;
                }
            }
        }

        public async Task RollbackAsync(CancellationToken cancellationToken = default)
        {
            if (_transaction == null)
            {
                throw new InvalidOperationException("No transaction to rollback");
            }

            try
            {
                await _transaction.RollbackAsync(cancellationToken);
            }
            finally
            {
                await _transaction.DisposeAsync();
                _transaction = null;

                if (_connection != null)
                {
                    await _connection.CloseAsync();
                    await _connection.DisposeAsync();
                    _connection = null;
                }
            }
        }

        public Task SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            return Task.CompletedTask;
        }

        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }

        protected virtual void Dispose(bool disposing)
        {
            if (!_disposed && disposing)
            {
                _transaction?.Dispose();
                _connection?.Dispose();
                _disposed = true;
            }
        }
    }
}