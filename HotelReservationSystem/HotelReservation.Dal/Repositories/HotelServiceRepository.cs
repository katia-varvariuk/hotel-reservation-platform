using Dapper;
using Npgsql;
using Microsoft.Extensions.Configuration;
using HotelReservation.Domain.Entities;
using HotelReservation.Dal.Interfaces;

namespace HotelReservation.Dal.Repositories
{
    public class HotelServiceRepository : IHotelServiceRepository
    {
        private readonly string _connectionString;

        public HotelServiceRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("HotelReservationsDB")
                ?? throw new ArgumentNullException("Connection string not found");
        }

        public async Task<IEnumerable<HotelService>> GetAllAsync(CancellationToken ct = default)
        {
            const string sql = @"
                SELECT serviceid, category, name, description, price, unit, includedin, sortorder
                FROM hotel_services ORDER BY sortorder, serviceid";
            await using var conn = new NpgsqlConnection(_connectionString);
            return await conn.QueryAsync<HotelService>(sql);
        }

        public async Task<HotelService?> GetByIdAsync(int id, CancellationToken ct = default)
        {
            const string sql = @"
                SELECT serviceid, category, name, description, price, unit, includedin, sortorder
                FROM hotel_services WHERE serviceid = @Id";
            await using var conn = new NpgsqlConnection(_connectionString);
            return await conn.QueryFirstOrDefaultAsync<HotelService>(sql, new { Id = id });
        }

        public async Task<int> CreateAsync(HotelService service, CancellationToken ct = default)
        {
            const string sql = @"
                INSERT INTO hotel_services (category, name, description, price, unit, includedin, sortorder)
                VALUES (@Category, @Name, @Description, @Price, @Unit, @IncludedIn, @SortOrder)
                RETURNING serviceid";
            await using var conn = new NpgsqlConnection(_connectionString);
            return await conn.QuerySingleAsync<int>(sql, new
            {
                service.Category, service.Name, service.Description,
                service.Price, service.Unit, service.IncludedIn, service.SortOrder
            });
        }

        public async Task<bool> UpdateAsync(HotelService service, CancellationToken ct = default)
        {
            const string sql = @"
                UPDATE hotel_services SET
                    category    = @Category,
                    name        = @Name,
                    description = @Description,
                    price       = @Price,
                    unit        = @Unit,
                    includedin  = @IncludedIn,
                    sortorder   = @SortOrder
                WHERE serviceid = @ServiceId";
            await using var conn = new NpgsqlConnection(_connectionString);
            var rows = await conn.ExecuteAsync(sql, new
            {
                service.Category, service.Name, service.Description,
                service.Price, service.Unit, service.IncludedIn, service.SortOrder, service.ServiceId
            });
            return rows > 0;
        }

        public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
        {
            const string sql = "DELETE FROM hotel_services WHERE serviceid = @Id";
            await using var conn = new NpgsqlConnection(_connectionString);
            var rows = await conn.ExecuteAsync(sql, new { Id = id });
            return rows > 0;
        }
    }
}
