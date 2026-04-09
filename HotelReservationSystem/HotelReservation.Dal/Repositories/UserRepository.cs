using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Npgsql;
using HotelReservation.Dal.Interfaces;
using HotelReservation.Domain.Entities;

namespace HotelReservation.Dal.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly string _connectionString;
        private readonly ILogger<UserRepository> _logger;

        public UserRepository(IConfiguration configuration, ILogger<UserRepository> logger)
        {
            _connectionString = configuration.GetConnectionString("HotelReservationsDB") ??
                throw new ArgumentNullException("Connection string not found");
            _logger = logger;
        }

        public async Task<User?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        {
            const string sql = @"
                SELECT userid, email, passwordhash, role, clientid, createdat, isblocked, fullname, phone, avatarurl
                FROM users
                WHERE userid = @Id";

            await using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync(cancellationToken);
            await using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@Id", id);
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);

            if (await reader.ReadAsync(cancellationToken))
                return MapFromReader(reader);

            return null;
        }

        public async Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
        {
            const string sql = @"
                SELECT userid, email, passwordhash, role, clientid, createdat, isblocked, fullname, phone, avatarurl
                FROM users
                WHERE email = @Email";

            await using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync(cancellationToken);
            await using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@Email", email.ToLowerInvariant());
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);

            if (await reader.ReadAsync(cancellationToken))
                return MapFromReader(reader);

            return null;
        }

        public async Task<int> CreateAsync(User user, CancellationToken cancellationToken = default)
        {
            const string sql = @"
                INSERT INTO users (email, passwordhash, role, clientid, createdat)
                VALUES (@Email, @PasswordHash, @Role, @ClientId, @CreatedAt)
                RETURNING userid";

            await using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync(cancellationToken);
            await using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@Email", user.Email.ToLowerInvariant());
            command.Parameters.AddWithValue("@PasswordHash", user.PasswordHash);
            command.Parameters.AddWithValue("@Role", user.Role.ToString());
            command.Parameters.AddWithValue("@ClientId", user.ClientId.HasValue ? (object)user.ClientId.Value : DBNull.Value);
            command.Parameters.AddWithValue("@CreatedAt", user.CreatedAt);

            var result = await command.ExecuteScalarAsync(cancellationToken);
            return Convert.ToInt32(result);
        }

        public async Task<IEnumerable<User>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            const string sql = @"
                SELECT userid, email, passwordhash, role, clientid, createdat, isblocked, fullname, phone, avatarurl
                FROM users ORDER BY createdat DESC";

            await using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync(cancellationToken);
            await using var command = new NpgsqlCommand(sql, connection);
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);

            var users = new List<User>();
            while (await reader.ReadAsync(cancellationToken))
                users.Add(MapFromReader(reader));
            return users;
        }

        public async Task SetBlockedAsync(int userId, bool isBlocked, CancellationToken cancellationToken = default)
        {
            const string sql = "UPDATE users SET isblocked = @IsBlocked WHERE userid = @UserId";
            await using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync(cancellationToken);
            await using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@IsBlocked", isBlocked);
            command.Parameters.AddWithValue("@UserId", userId);
            await command.ExecuteNonQueryAsync(cancellationToken);
        }

        public async Task UpdatePasswordAsync(int userId, string passwordHash, CancellationToken cancellationToken = default)
        {
            const string sql = "UPDATE users SET passwordhash = @PasswordHash WHERE userid = @UserId";

            await using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync(cancellationToken);
            await using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@PasswordHash", passwordHash);
            command.Parameters.AddWithValue("@UserId", userId);
            await command.ExecuteNonQueryAsync(cancellationToken);
        }

        public async Task UpdateProfileAsync(int userId, string fullName, string? phone, string? avatarUrl, CancellationToken cancellationToken = default)
        {
            const string sql = "UPDATE users SET fullname = @FullName, phone = @Phone, avatarurl = @AvatarUrl WHERE userid = @UserId";

            await using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync(cancellationToken);
            await using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@FullName", fullName);
            command.Parameters.AddWithValue("@Phone", (object?)phone ?? DBNull.Value);
            command.Parameters.AddWithValue("@AvatarUrl", (object?)avatarUrl ?? DBNull.Value);
            command.Parameters.AddWithValue("@UserId", userId);
            await command.ExecuteNonQueryAsync(cancellationToken);
        }

        private static User MapFromReader(System.Data.IDataReader reader)
        {
            var roleStr = reader.GetString(reader.GetOrdinal("role"));
            return new User
            {
                UserId = reader.GetInt32(reader.GetOrdinal("userid")),
                Email = reader.GetString(reader.GetOrdinal("email")),
                PasswordHash = reader.GetString(reader.GetOrdinal("passwordhash")),
                Role = Enum.Parse<UserRole>(roleStr),
                ClientId = reader.IsDBNull(reader.GetOrdinal("clientid"))
                    ? null
                    : reader.GetInt32(reader.GetOrdinal("clientid")),
                CreatedAt = reader.GetDateTime(reader.GetOrdinal("createdat")),
                IsBlocked = !reader.IsDBNull(reader.GetOrdinal("isblocked")) && reader.GetBoolean(reader.GetOrdinal("isblocked")),
                FullName = reader.IsDBNull(reader.GetOrdinal("fullname")) ? string.Empty : reader.GetString(reader.GetOrdinal("fullname")),
                Phone = reader.IsDBNull(reader.GetOrdinal("phone")) ? null : reader.GetString(reader.GetOrdinal("phone")),
                AvatarUrl = reader.IsDBNull(reader.GetOrdinal("avatarurl")) ? null : reader.GetString(reader.GetOrdinal("avatarurl")),
            };
        }
    }
}
