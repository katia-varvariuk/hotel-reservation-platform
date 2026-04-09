using Dapper;
using Npgsql;
using Microsoft.Extensions.Configuration;
using HotelReservation.Domain.Entities;
using HotelReservation.Dal.Interfaces;

namespace HotelReservation.Dal.Repositories
{
    public class AmenityRepository : IAmenityRepository
    {
        private readonly string _connectionString;

        public AmenityRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("HotelReservationsDB")
                ?? throw new ArgumentNullException("Connection string not found");
        }

        public async Task<IEnumerable<Amenity>> GetAllAsync(CancellationToken ct = default)
        {
            const string sql = "SELECT amenityid, name, icon FROM amenities ORDER BY name";
            await using var conn = new NpgsqlConnection(_connectionString);
            return await conn.QueryAsync<Amenity>(sql);
        }

        public async Task<Amenity?> GetByIdAsync(int id, CancellationToken ct = default)
        {
            const string sql = "SELECT amenityid, name, icon FROM amenities WHERE amenityid = @Id";
            await using var conn = new NpgsqlConnection(_connectionString);
            return await conn.QueryFirstOrDefaultAsync<Amenity>(sql, new { Id = id });
        }

        public async Task<int> CreateAsync(Amenity amenity, CancellationToken ct = default)
        {
            const string sql = @"
                INSERT INTO amenities (name, icon)
                VALUES (@Name, @Icon)
                RETURNING amenityid";
            await using var conn = new NpgsqlConnection(_connectionString);
            return await conn.QuerySingleAsync<int>(sql, new { amenity.Name, amenity.Icon });
        }

        public async Task<bool> UpdateAsync(Amenity amenity, CancellationToken ct = default)
        {
            const string sql = "UPDATE amenities SET name = @Name, icon = @Icon WHERE amenityid = @AmenityId";
            await using var conn = new NpgsqlConnection(_connectionString);
            var rows = await conn.ExecuteAsync(sql, new { amenity.Name, amenity.Icon, amenity.AmenityId });
            return rows > 0;
        }

        public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
        {
            const string sql = "DELETE FROM amenities WHERE amenityid = @Id";
            await using var conn = new NpgsqlConnection(_connectionString);
            var rows = await conn.ExecuteAsync(sql, new { Id = id });
            return rows > 0;
        }

        public async Task<IEnumerable<Amenity>> GetByRoomIdAsync(int roomId, CancellationToken ct = default)
        {
            const string sql = @"
                SELECT a.amenityid, a.name, a.icon
                FROM amenities a
                JOIN room_amenities ra ON ra.amenityid = a.amenityid
                WHERE ra.roomid = @RoomId
                ORDER BY a.name";
            await using var conn = new NpgsqlConnection(_connectionString);
            return await conn.QueryAsync<Amenity>(sql, new { RoomId = roomId });
        }

        public async Task SetRoomAmenitiesAsync(int roomId, IEnumerable<int> amenityIds, CancellationToken ct = default)
        {
            await using var conn = new NpgsqlConnection(_connectionString);
            await conn.OpenAsync(ct);
            await using var tx = await conn.BeginTransactionAsync(ct);

            await conn.ExecuteAsync("DELETE FROM room_amenities WHERE roomid = @RoomId",
                new { RoomId = roomId }, transaction: tx);

            foreach (var aid in amenityIds)
            {
                await conn.ExecuteAsync(
                    "INSERT INTO room_amenities (roomid, amenityid) VALUES (@RoomId, @AmenityId)",
                    new { RoomId = roomId, AmenityId = aid }, transaction: tx);
            }

            await tx.CommitAsync(ct);
        }
    }
}
