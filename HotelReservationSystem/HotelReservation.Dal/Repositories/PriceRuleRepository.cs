using Dapper;
using Npgsql;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using HotelReservation.Dal.Interfaces;
using HotelReservation.Domain.Entities;

namespace HotelReservation.Dal.Repositories
{
    public class PriceRuleRepository : IPriceRuleRepository
    {
        private readonly string _connectionString;
        private readonly ILogger<PriceRuleRepository> _logger;

        public PriceRuleRepository(IConfiguration configuration, ILogger<PriceRuleRepository> logger)
        {
            _connectionString = configuration.GetConnectionString("HotelReservationsDB") ??
                throw new ArgumentNullException("Connection string not found");
            _logger = logger;
        }

        public async Task<PriceRule?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        {
            const string sql = @"
                SELECT priceruleid, name, ruletype, seasonmonthfrom, seasonmonthto,
                       applicabledayofweek, occupancythresholdpercent, mindurationdays,
                       coefficient, isactive, createdat
                FROM price_rules WHERE priceruleid = @Id";

            await using var connection = new NpgsqlConnection(_connectionString);
            return await connection.QueryFirstOrDefaultAsync<PriceRule>(sql, new { Id = id });
        }

        public async Task<IEnumerable<PriceRule>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            const string sql = @"
                SELECT priceruleid, name, ruletype, seasonmonthfrom, seasonmonthto,
                       applicabledayofweek, occupancythresholdpercent, mindurationdays,
                       coefficient, isactive, createdat
                FROM price_rules ORDER BY ruletype, name";

            await using var connection = new NpgsqlConnection(_connectionString);
            return await connection.QueryAsync<PriceRule>(sql);
        }

        public async Task<IEnumerable<PriceRule>> GetActiveAsync(CancellationToken cancellationToken = default)
        {
            const string sql = @"
                SELECT priceruleid, name, ruletype, seasonmonthfrom, seasonmonthto,
                       applicabledayofweek, occupancythresholdpercent, mindurationdays,
                       coefficient, isactive, createdat
                FROM price_rules WHERE isactive = TRUE ORDER BY ruletype, name";

            await using var connection = new NpgsqlConnection(_connectionString);
            return await connection.QueryAsync<PriceRule>(sql);
        }

        public async Task<int> CreateAsync(PriceRule rule, CancellationToken cancellationToken = default)
        {
            const string sql = @"
                INSERT INTO price_rules
                    (name, ruletype, seasonmonthfrom, seasonmonthto, applicabledayofweek,
                     occupancythresholdpercent, mindurationdays, coefficient, isactive, createdat)
                VALUES
                    (@Name, @RuleType, @SeasonMonthFrom, @SeasonMonthTo, @ApplicableDayOfWeek,
                     @OccupancyThresholdPercent, @MinDurationDays, @Coefficient, @IsActive, @CreatedAt)
                RETURNING priceruleid";

            await using var connection = new NpgsqlConnection(_connectionString);
            return await connection.QuerySingleAsync<int>(sql, new
            {
                rule.Name,
                RuleType = rule.RuleType.ToString(),
                rule.SeasonMonthFrom,
                rule.SeasonMonthTo,
                rule.ApplicableDayOfWeek,
                rule.OccupancyThresholdPercent,
                rule.MinDurationDays,
                rule.Coefficient,
                rule.IsActive,
                CreatedAt = DateTime.UtcNow
            });
        }

        public async Task<bool> UpdateAsync(PriceRule rule, CancellationToken cancellationToken = default)
        {
            const string sql = @"
                UPDATE price_rules SET
                    name = @Name, ruletype = @RuleType,
                    seasonmonthfrom = @SeasonMonthFrom, seasonmonthto = @SeasonMonthTo,
                    applicabledayofweek = @ApplicableDayOfWeek,
                    occupancythresholdpercent = @OccupancyThresholdPercent,
                    mindurationdays = @MinDurationDays,
                    coefficient = @Coefficient, isactive = @IsActive
                WHERE priceruleid = @PriceRuleId";

            await using var connection = new NpgsqlConnection(_connectionString);
            var rows = await connection.ExecuteAsync(sql, new
            {
                rule.PriceRuleId,
                rule.Name,
                RuleType = rule.RuleType.ToString(),
                rule.SeasonMonthFrom,
                rule.SeasonMonthTo,
                rule.ApplicableDayOfWeek,
                rule.OccupancyThresholdPercent,
                rule.MinDurationDays,
                rule.Coefficient,
                rule.IsActive
            });
            return rows > 0;
        }

        public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
        {
            const string sql = "DELETE FROM price_rules WHERE priceruleid = @Id";
            await using var connection = new NpgsqlConnection(_connectionString);
            var rows = await connection.ExecuteAsync(sql, new { Id = id });
            return rows > 0;
        }
    }
}
