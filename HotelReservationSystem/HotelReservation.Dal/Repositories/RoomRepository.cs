using Dapper;
using Npgsql;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using HotelReservation.Domain.Entities;
using HotelReservation.Dal.Interfaces;

namespace HotelReservation.Dal.Repositories
{
    public class RoomRepository : IRoomRepository
    {
        private readonly string _connectionString;
        private readonly ILogger<RoomRepository> _logger;

        public RoomRepository(IConfiguration configuration, ILogger<RoomRepository> logger)
        {
            _connectionString = configuration.GetConnectionString("HotelReservationsDB") ??
                throw new ArgumentNullException("Connection string not found");
            _logger = logger;
        }

        public async Task<Room?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        {
            const string sql = @"
                SELECT roomid, roomnumber, capacity, price, roomtype, status, description, photourl
                FROM rooms WHERE roomid = @Id";

            await using var connection = new NpgsqlConnection(_connectionString);
            return await connection.QueryFirstOrDefaultAsync<Room>(sql, new { Id = id });
        }

        public async Task<IEnumerable<Room>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            const string sql = @"
                SELECT roomid, roomnumber, capacity, price, roomtype, status, description, photourl
                FROM rooms ORDER BY roomnumber";

            await using var connection = new NpgsqlConnection(_connectionString);
            return await connection.QueryAsync<Room>(sql);
        }

        public async Task<int> CreateAsync(Room entity, CancellationToken cancellationToken = default)
        {
            const string sql = @"
                INSERT INTO rooms (roomnumber, capacity, price, roomtype, status, description, photourl)
                VALUES (@RoomNumber, @Capacity, @Price, @RoomType, @Status, @Description, @PhotoUrl)
                RETURNING roomid";

            await using var connection = new NpgsqlConnection(_connectionString);
            return await connection.QuerySingleAsync<int>(sql, new
            {
                entity.RoomNumber,
                entity.Capacity,
                entity.Price,
                RoomType = entity.RoomType.ToString(),
                Status = entity.Status.ToString(),
                entity.Description,
                entity.PhotoUrl
            });
        }

        public async Task<bool> UpdateAsync(Room entity, CancellationToken cancellationToken = default)
        {
            const string sql = @"
                UPDATE rooms SET
                    roomnumber  = @RoomNumber,
                    capacity    = @Capacity,
                    price       = @Price,
                    roomtype    = @RoomType,
                    status      = @Status,
                    description = @Description,
                    photourl    = @PhotoUrl
                WHERE roomid = @RoomId";

            await using var connection = new NpgsqlConnection(_connectionString);
            var rows = await connection.ExecuteAsync(sql, new
            {
                entity.RoomId,
                entity.RoomNumber,
                entity.Capacity,
                entity.Price,
                RoomType = entity.RoomType.ToString(),
                Status = entity.Status.ToString(),
                entity.Description,
                entity.PhotoUrl
            });
            return rows > 0;
        }

        public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
        {
            const string sql = "DELETE FROM rooms WHERE roomid = @Id";
            await using var connection = new NpgsqlConnection(_connectionString);
            var rows = await connection.ExecuteAsync(sql, new { Id = id });
            return rows > 0;
        }

        public async Task<IEnumerable<Room>> GetAvailableRoomsAsync(DateTime checkIn, DateTime checkOut,
            string? roomType = null, int? minCapacity = null, CancellationToken cancellationToken = default)
        {
            const string sql = @"
                SELECT r.roomid, r.roomnumber, r.capacity, r.price, r.roomtype, r.status, r.description, r.photourl
                FROM rooms r
                WHERE r.status = 'Available'
                  AND (@RoomType IS NULL OR r.roomtype = @RoomType)
                  AND (@MinCapacity IS NULL OR r.capacity >= @MinCapacity)
                  AND r.roomid NOT IN (
                      SELECT res.roomid
                      FROM reservations res
                      WHERE res.status NOT IN ('CheckedOut', 'Cancelled')
                        AND res.checkindate  < @CheckOut
                        AND res.checkoutdate > @CheckIn
                  )
                ORDER BY r.roomnumber";

            await using var connection = new NpgsqlConnection(_connectionString);
            return await connection.QueryAsync<Room>(sql, new
            {
                CheckIn = checkIn,
                CheckOut = checkOut,
                RoomType = roomType,
                MinCapacity = minCapacity
            });
        }

        public async Task<Room?> GetByRoomNumberAsync(string roomNumber, CancellationToken cancellationToken = default)
        {
            const string sql = @"
                SELECT roomid, roomnumber, capacity, price, roomtype, status, description, photourl
                FROM rooms WHERE roomnumber = @RoomNumber";

            await using var connection = new NpgsqlConnection(_connectionString);
            return await connection.QueryFirstOrDefaultAsync<Room>(sql, new { RoomNumber = roomNumber });
        }
    }
}
