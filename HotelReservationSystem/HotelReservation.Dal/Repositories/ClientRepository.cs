using System.Data;
using Npgsql;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using HotelReservation.Domain.Entities;
using HotelReservation.Dal.Interfaces;

namespace HotelReservation.Dal.Repositories
{
    public class ClientRepository : IClientRepository
    {
        private readonly string _connectionString;
        private readonly ILogger<ClientRepository> _logger;

        public ClientRepository(IConfiguration configuration, ILogger<ClientRepository> logger)
        {
            _connectionString = configuration.GetConnectionString("HotelReservationsDB") ??
                throw new ArgumentNullException("Connection string not found");
            _logger = logger;
        }

        public async Task<Client?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        {
            const string sql = @"
                SELECT clientid, fullname, passportdata, phone, email, createdat, avatarurl, loyalty_tier
                FROM clients
                WHERE clientid = @Id";

            await using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync(cancellationToken);

            await using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@Id", id);

            await using var reader = await command.ExecuteReaderAsync(cancellationToken);

            if (await reader.ReadAsync(cancellationToken))
            {
                return MapClientFromReader(reader);
            }

            return null;
        }

        public async Task<IEnumerable<Client>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            const string sql = @"
                SELECT clientid, fullname, passportdata, phone, email, createdat, avatarurl, loyalty_tier
                FROM clients
                ORDER BY fullname";

            var clients = new List<Client>();

            await using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync(cancellationToken);

            await using var command = new NpgsqlCommand(sql, connection);
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);

            while (await reader.ReadAsync(cancellationToken))
            {
                clients.Add(MapClientFromReader(reader));
            }

            return clients;
        }

        public async Task<int> CreateAsync(Client entity, CancellationToken cancellationToken = default)
        {
            const string sql = @"
                INSERT INTO clients (fullname, passportdata, phone, email, createdat)
                VALUES (@FullName, @PassportData, @Phone, @Email, @CreatedAt)
                RETURNING clientid";

            await using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync(cancellationToken);

            await using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@FullName", entity.FullName);
            command.Parameters.AddWithValue("@PassportData", string.IsNullOrEmpty(entity.PassportData) ? DBNull.Value : (object)entity.PassportData);
            command.Parameters.AddWithValue("@Phone", string.IsNullOrEmpty(entity.Phone) ? DBNull.Value : (object)entity.Phone);
            command.Parameters.AddWithValue("@Email", entity.Email);
            command.Parameters.AddWithValue("@CreatedAt", entity.CreatedAt);

            var result = await command.ExecuteScalarAsync(cancellationToken);
            return Convert.ToInt32(result);
        }

        public async Task<bool> UpdateAsync(Client entity, CancellationToken cancellationToken = default)
        {
            const string sql = @"
                UPDATE clients
                SET fullname     = @FullName,
                    passportdata = @PassportData,
                    phone        = @Phone,
                    email        = @Email,
                    avatarurl    = @AvatarUrl
                WHERE clientid = @ClientId";

            await using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync(cancellationToken);

            await using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@ClientId", entity.ClientId);
            command.Parameters.AddWithValue("@FullName", entity.FullName);
            command.Parameters.AddWithValue("@PassportData", string.IsNullOrEmpty(entity.PassportData) ? DBNull.Value : (object)entity.PassportData);
            command.Parameters.AddWithValue("@Phone", string.IsNullOrEmpty(entity.Phone) ? DBNull.Value : (object)entity.Phone);
            command.Parameters.AddWithValue("@Email", entity.Email);
            command.Parameters.AddWithValue("@AvatarUrl", string.IsNullOrEmpty(entity.AvatarUrl) ? DBNull.Value : (object)entity.AvatarUrl);

            var rowsAffected = await command.ExecuteNonQueryAsync(cancellationToken);
            return rowsAffected > 0;
        }

        public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
        {
            const string sql = "DELETE FROM clients WHERE clientid = @Id";

            await using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync(cancellationToken);

            await using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@Id", id);

            var rowsAffected = await command.ExecuteNonQueryAsync(cancellationToken);
            return rowsAffected > 0;
        }

        public async Task<Client?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
        {
            const string sql = @"
                SELECT clientid, fullname, passportdata, phone, email, createdat, avatarurl, loyalty_tier
                FROM clients
                WHERE email = @Email";

            await using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync(cancellationToken);

            await using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@Email", email);

            await using var reader = await command.ExecuteReaderAsync(cancellationToken);

            if (await reader.ReadAsync(cancellationToken))
            {
                return MapClientFromReader(reader);
            }

            return null;
        }

        public async Task<IEnumerable<Client>> SearchAsync(string searchTerm, CancellationToken cancellationToken = default)
        {
            const string sql = @"
                SELECT clientid, fullname, passportdata, phone, email, createdat, avatarurl, loyalty_tier
                FROM clients
                WHERE fullname ILIKE @SearchTerm OR email ILIKE @SearchTerm
                ORDER BY fullname";

            var clients = new List<Client>();

            await using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync(cancellationToken);

            await using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@SearchTerm", $"%{searchTerm}%");

            await using var reader = await command.ExecuteReaderAsync(cancellationToken);

            while (await reader.ReadAsync(cancellationToken))
            {
                clients.Add(MapClientFromReader(reader));
            }

            return clients;
        }

        public async Task<bool> SetLoyaltyTierAsync(int clientId, string tier, CancellationToken cancellationToken = default)
        {
            const string sql = "UPDATE clients SET loyalty_tier = @Tier WHERE clientid = @Id";
            await using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync(cancellationToken);
            await using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@Tier", tier);
            command.Parameters.AddWithValue("@Id", clientId);
            return await command.ExecuteNonQueryAsync(cancellationToken) > 0;
        }

        private static Client MapClientFromReader(IDataReader reader)
        {
            int passportOrd = reader.GetOrdinal("passportdata");
            int phoneOrd = reader.GetOrdinal("phone");
            int emailOrd = reader.GetOrdinal("email");
            int loyaltyOrd = reader.GetOrdinal("loyalty_tier");
            return new Client
            {
                ClientId = reader.GetInt32(reader.GetOrdinal("clientid")),
                FullName = reader.GetString(reader.GetOrdinal("fullname")),
                PassportData = reader.IsDBNull(passportOrd) ? string.Empty : reader.GetString(passportOrd),
                Phone = reader.IsDBNull(phoneOrd) ? string.Empty : reader.GetString(phoneOrd),
                Email = reader.IsDBNull(emailOrd) ? string.Empty : reader.GetString(emailOrd),
                CreatedAt = reader.GetDateTime(reader.GetOrdinal("createdat")),
                AvatarUrl = reader.IsDBNull(reader.GetOrdinal("avatarurl")) ? null : reader.GetString(reader.GetOrdinal("avatarurl")),
                LoyaltyTier = reader.IsDBNull(loyaltyOrd) ? "new" : reader.GetString(loyaltyOrd),
            };
        }
    }
}