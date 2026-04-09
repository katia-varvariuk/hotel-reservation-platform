using Dapper;
using Npgsql;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using HotelReservation.Domain.Entities;
using HotelReservation.Dal.Interfaces;

namespace HotelReservation.Dal.Repositories
{
    public class PaymentRepository : IPaymentRepository
    {
        private readonly string _connectionString;
        private readonly ILogger<PaymentRepository> _logger;

        public PaymentRepository(IConfiguration configuration, ILogger<PaymentRepository> logger)
        {
            _connectionString = configuration.GetConnectionString("HotelReservationsDB") ??
                throw new ArgumentNullException("Connection string not found");
            _logger = logger;
        }

        public async Task<Payment?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        {
            const string sql = @"
                SELECT paymentid, reservationid, amount, paymentdate, method 
                FROM payments 
                WHERE paymentid = @Id";

            await using var connection = new NpgsqlConnection(_connectionString);

            return await connection.QueryFirstOrDefaultAsync<Payment>(sql, new { Id = id });
        }

        public async Task<IEnumerable<Payment>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            const string sql = @"
                SELECT paymentid, reservationid, amount, paymentdate, method 
                FROM payments 
                ORDER BY paymentdate DESC";

            await using var connection = new NpgsqlConnection(_connectionString);

            return await connection.QueryAsync<Payment>(sql);
        }

        public async Task<int> CreateAsync(Payment entity, CancellationToken cancellationToken = default)
        {
            const string sql = @"
                INSERT INTO payments (reservationid, amount, paymentdate, method)
                VALUES (@ReservationId, @Amount, @PaymentDate, @Method)
                RETURNING paymentid";

            await using var connection = new NpgsqlConnection(_connectionString);

            return await connection.QuerySingleAsync<int>(sql, new
            {
                entity.ReservationId,
                entity.Amount,
                entity.PaymentDate,
                entity.Method
            });
        }

        public async Task<bool> UpdateAsync(Payment entity, CancellationToken cancellationToken = default)
        {
            const string sql = @"
                UPDATE payments 
                SET reservationid = @ReservationId, 
                    amount = @Amount, 
                    paymentdate = @PaymentDate, 
                    method = @Method
                WHERE paymentid = @PaymentId";

            await using var connection = new NpgsqlConnection(_connectionString);

            var rowsAffected = await connection.ExecuteAsync(sql, new
            {
                entity.PaymentId,
                entity.ReservationId,
                entity.Amount,
                entity.PaymentDate,
                entity.Method
            });

            return rowsAffected > 0;
        }

        public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
        {
            const string sql = "DELETE FROM payments WHERE paymentid = @Id";

            await using var connection = new NpgsqlConnection(_connectionString);

            var rowsAffected = await connection.ExecuteAsync(sql, new { Id = id });
            return rowsAffected > 0;
        }

        public async Task<IEnumerable<Payment>> GetByReservationIdAsync(int reservationId, CancellationToken cancellationToken = default)
        {
            const string sql = @"
                SELECT paymentid, reservationid, amount, paymentdate, method 
                FROM payments 
                WHERE reservationid = @ReservationId
                ORDER BY paymentdate DESC";

            await using var connection = new NpgsqlConnection(_connectionString);

            return await connection.QueryAsync<Payment>(sql, new { ReservationId = reservationId });
        }
    }
}