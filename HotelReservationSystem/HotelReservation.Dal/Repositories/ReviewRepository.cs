using Dapper;
using Npgsql;
using Microsoft.Extensions.Configuration;
using HotelReservation.Domain.Entities;
using HotelReservation.Dal.Interfaces;

namespace HotelReservation.Dal.Repositories
{
    public class ReviewRepository : IReviewRepository
    {
        private readonly string _connectionString;

        public ReviewRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("HotelReservationsDB")
                ?? throw new ArgumentNullException("Connection string not found");
        }

        public async Task<IEnumerable<Review>> GetByRoomIdAsync(int roomId, CancellationToken cancellationToken = default)
        {
            const string sql = @"
                SELECT r.reviewid, r.clientid, r.roomid, r.rating, r.comment, r.createdat,
                       c.fullname AS clientname, c.avatarurl
                FROM reviews r
                JOIN clients c ON c.clientid = r.clientid
                WHERE r.roomid = @RoomId
                ORDER BY r.createdat DESC";

            await using var conn = new NpgsqlConnection(_connectionString);
            return await conn.QueryAsync<Review>(sql, new { RoomId = roomId });
        }

        public async Task<Review?> GetByClientAndRoomAsync(int clientId, int roomId, CancellationToken cancellationToken = default)
        {
            const string sql = @"
                SELECT reviewid, clientid, roomid, rating, comment, createdat
                FROM reviews WHERE clientid = @ClientId AND roomid = @RoomId";

            await using var conn = new NpgsqlConnection(_connectionString);
            return await conn.QueryFirstOrDefaultAsync<Review>(sql, new { ClientId = clientId, RoomId = roomId });
        }

        public async Task<int> CreateAsync(Review review, CancellationToken cancellationToken = default)
        {
            const string sql = @"
                INSERT INTO reviews (clientid, roomid, rating, comment, createdat)
                VALUES (@ClientId, @RoomId, @Rating, @Comment, @CreatedAt)
                RETURNING reviewid";

            await using var conn = new NpgsqlConnection(_connectionString);
            return await conn.QuerySingleAsync<int>(sql, new
            {
                review.ClientId, review.RoomId, review.Rating,
                review.Comment, CreatedAt = DateTime.UtcNow
            });
        }

        public async Task<IEnumerable<Review>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            const string sql = @"
                SELECT r.reviewid, r.clientid, r.roomid, r.rating, r.comment, r.createdat,
                       c.fullname AS clientname, rm.roomnumber
                FROM reviews r
                JOIN clients c ON c.clientid = r.clientid
                JOIN rooms rm ON rm.roomid = r.roomid
                ORDER BY r.createdat DESC";
            await using var conn = new NpgsqlConnection(_connectionString);
            return await conn.QueryAsync<Review>(sql);
        }

        public async Task<bool> AdminUpdateAsync(int reviewId, int rating, string? comment, CancellationToken cancellationToken = default)
        {
            const string sql = "UPDATE reviews SET rating = @Rating, comment = @Comment WHERE reviewid = @ReviewId";
            await using var conn = new NpgsqlConnection(_connectionString);
            var rows = await conn.ExecuteAsync(sql, new { Rating = rating, Comment = comment, ReviewId = reviewId });
            return rows > 0;
        }

        public async Task<bool> UpdateAsync(Review review, CancellationToken cancellationToken = default)
        {
            const string sql = @"
                UPDATE reviews SET rating = @Rating, comment = @Comment
                WHERE reviewid = @ReviewId AND clientid = @ClientId";

            await using var conn = new NpgsqlConnection(_connectionString);
            var rows = await conn.ExecuteAsync(sql, new { review.Rating, review.Comment, review.ReviewId, review.ClientId });
            return rows > 0;
        }

        public async Task<bool> DeleteAsync(int reviewId, CancellationToken cancellationToken = default)
        {
            const string sql = "DELETE FROM reviews WHERE reviewid = @ReviewId";
            await using var conn = new NpgsqlConnection(_connectionString);
            var rows = await conn.ExecuteAsync(sql, new { ReviewId = reviewId });
            return rows > 0;
        }

        public async Task<(double Average, int Count)> GetRatingStatsAsync(int roomId, CancellationToken cancellationToken = default)
        {
            const string sql = @"
                SELECT COALESCE(AVG(rating), 0) AS average, COUNT(*) AS count
                FROM reviews WHERE roomid = @RoomId";

            await using var conn = new NpgsqlConnection(_connectionString);
            var result = await conn.QuerySingleAsync(sql, new { RoomId = roomId });
            return ((double)result.average, (int)result.count);
        }

        public async Task<int> CountByClientAsync(int clientId, CancellationToken cancellationToken = default)
        {
            const string sql = "SELECT COUNT(*) FROM reviews WHERE clientid = @ClientId";
            await using var conn = new NpgsqlConnection(_connectionString);
            return await conn.ExecuteScalarAsync<int>(sql, new { ClientId = clientId });
        }
    }
}
