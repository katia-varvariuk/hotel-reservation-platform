using Dapper;
using Npgsql;
using Microsoft.Extensions.Configuration;
using HotelReservation.Dal.Interfaces;

namespace HotelReservation.Dal.Repositories
{
    public class FavoriteRepository : IFavoriteRepository
    {
        private readonly string _connectionString;

        public FavoriteRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("HotelReservationsDB")
                ?? throw new ArgumentNullException("Connection string not found");
        }

        public async Task<IEnumerable<int>> GetRoomIdsByClientAsync(int clientId, CancellationToken cancellationToken = default)
        {
            const string sql = "SELECT roomid FROM favorites WHERE clientid = @ClientId";
            await using var conn = new NpgsqlConnection(_connectionString);
            return await conn.QueryAsync<int>(sql, new { ClientId = clientId });
        }

        public async Task<bool> ExistsAsync(int clientId, int roomId, CancellationToken cancellationToken = default)
        {
            const string sql = "SELECT COUNT(1) FROM favorites WHERE clientid = @ClientId AND roomid = @RoomId";
            await using var conn = new NpgsqlConnection(_connectionString);
            var count = await conn.QuerySingleAsync<int>(sql, new { ClientId = clientId, RoomId = roomId });
            return count > 0;
        }

        public async Task AddAsync(int clientId, int roomId, CancellationToken cancellationToken = default)
        {
            const string sql = @"
                INSERT INTO favorites (clientid, roomid, createdat)
                VALUES (@ClientId, @RoomId, @CreatedAt)
                ON CONFLICT (clientid, roomid) DO NOTHING";
            await using var conn = new NpgsqlConnection(_connectionString);
            await conn.ExecuteAsync(sql, new { ClientId = clientId, RoomId = roomId, CreatedAt = DateTime.UtcNow });
        }

        public async Task RemoveAsync(int clientId, int roomId, CancellationToken cancellationToken = default)
        {
            const string sql = "DELETE FROM favorites WHERE clientid = @ClientId AND roomid = @RoomId";
            await using var conn = new NpgsqlConnection(_connectionString);
            await conn.ExecuteAsync(sql, new { ClientId = clientId, RoomId = roomId });
        }
    }
}
