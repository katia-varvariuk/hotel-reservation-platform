using Dapper;
using Npgsql;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using HotelReservation.Dal.Interfaces;
using HotelReservation.Domain.Entities;

namespace HotelReservation.Dal.Repositories
{
    public class PriceHistoryRepository : IPriceHistoryRepository
    {
        private readonly string _connectionString;
        private readonly ILogger<PriceHistoryRepository> _logger;

        public PriceHistoryRepository(IConfiguration configuration, ILogger<PriceHistoryRepository> logger)
        {
            _connectionString = configuration.GetConnectionString("HotelReservationsDB") ??
                throw new ArgumentNullException("Connection string not found");
            _logger = logger;
        }

        public async Task<IEnumerable<PriceHistory>> GetByRoomIdAsync(int roomId, CancellationToken cancellationToken = default)
        {
            const string sql = @"
                SELECT pricehistoryid, roomid, oldprice, newprice, reason, changedat
                FROM price_history
                WHERE roomid = @RoomId
                ORDER BY changedat DESC";

            await using var connection = new NpgsqlConnection(_connectionString);
            return await connection.QueryAsync<PriceHistory>(sql, new { RoomId = roomId });
        }

        public async Task<int> CreateAsync(PriceHistory history, CancellationToken cancellationToken = default)
        {
            const string sql = @"
                INSERT INTO price_history (roomid, oldprice, newprice, reason, changedat)
                VALUES (@RoomId, @OldPrice, @NewPrice, @Reason, @ChangedAt)
                RETURNING pricehistoryid";

            await using var connection = new NpgsqlConnection(_connectionString);
            return await connection.QuerySingleAsync<int>(sql, new
            {
                history.RoomId,
                history.OldPrice,
                history.NewPrice,
                history.Reason,
                ChangedAt = DateTime.UtcNow
            });
        }
    }
}
