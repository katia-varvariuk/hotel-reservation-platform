using Dapper;
using Npgsql;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using HotelReservation.Dal.Interfaces;
using HotelReservation.Domain.Entities;

namespace HotelReservation.Dal.Repositories
{
    public class StatisticsRepository : IStatisticsRepository
    {
        private readonly string _connectionString;
        private readonly ILogger<StatisticsRepository> _logger;

        public StatisticsRepository(IConfiguration configuration, ILogger<StatisticsRepository> logger)
        {
            _connectionString = configuration.GetConnectionString("HotelReservationsDB") ??
                throw new ArgumentNullException("Connection string not found");
            _logger = logger;
        }

        public async Task<StatisticsData> GetAsync(CancellationToken cancellationToken = default)
        {
            const string sql = @"
                SELECT
                    (SELECT COUNT(*) FROM rooms)                                              AS totalrooms,
                    (SELECT COUNT(*) FROM rooms r
                     WHERE r.status = 'Available'
                       AND r.roomid NOT IN (
                           SELECT roomid FROM reservations
                           WHERE status IN ('Pending','Confirmed','CheckedIn')
                             AND checkindate  <= @Now
                             AND checkoutdate >  @Now))                                      AS availableroomstoday,
                    (SELECT COUNT(*) FROM reservations)                                      AS totalreservations,
                    (SELECT COUNT(*) FROM reservations WHERE status IN ('Pending','Confirmed','CheckedIn'))  AS activereservations,
                    (SELECT COALESCE(SUM(totalprice),0) FROM reservations WHERE status = 'CheckedOut') AS totalrevenue,
                    (SELECT COALESCE(SUM(totalprice),0) FROM reservations
                     WHERE status = 'CheckedOut'
                       AND DATE_TRUNC('month',checkoutdate) = DATE_TRUNC('month',@Now))      AS revenuethismonth,
                    (SELECT COUNT(*) FROM clients
                     WHERE DATE_TRUNC('month',createdat) = DATE_TRUNC('month',@Now))         AS newclientsthismonth;

                SELECT status, COUNT(*) AS cnt FROM reservations GROUP BY status;

                SELECT TO_CHAR(DATE_TRUNC('month', checkoutdate), 'Mon YY') AS month,
                       DATE_TRUNC('month', checkoutdate) AS monthdate,
                       COALESCE(SUM(totalprice), 0) AS revenue,
                       COUNT(*) AS cnt
                FROM reservations
                WHERE status = 'CheckedOut'
                  AND checkoutdate >= @SixMonthsAgo
                GROUP BY DATE_TRUNC('month', checkoutdate)
                ORDER BY DATE_TRUNC('month', checkoutdate);

                SELECT r.reservationid, c.fullname AS clientname, rm.roomnumber,
                       r.checkindate, r.checkoutdate, r.totalprice, r.status
                FROM reservations r
                LEFT JOIN clients c ON c.clientid = r.clientid
                LEFT JOIN rooms rm ON rm.roomid = r.roomid
                ORDER BY r.reservationid DESC
                LIMIT 6;

                SELECT rm.roomnumber, rm.roomtype, COUNT(*) AS bookingcount,
                       COALESCE(SUM(r.totalprice), 0) AS totalrevenue
                FROM reservations r
                JOIN rooms rm ON rm.roomid = r.roomid
                WHERE r.status = 'CheckedOut'
                GROUP BY rm.roomid, rm.roomnumber, rm.roomtype
                ORDER BY bookingcount DESC
                LIMIT 5;";

            await using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync(cancellationToken);

            await using var multi = await connection.QueryMultipleAsync(sql, new
            {
                Now = DateTime.UtcNow,
                SixMonthsAgo = DateTime.UtcNow.AddMonths(-5).Date.AddDays(1 - DateTime.UtcNow.Day)
            });

            var row = await multi.ReadSingleAsync();
            var statusRows = (await multi.ReadAsync()).ToList();
            var monthlyRows = (await multi.ReadAsync()).ToList();
            var recentRows = (await multi.ReadAsync()).ToList();
            var topRoomRows = (await multi.ReadAsync()).ToList();

            int totalRooms = (int)(long)row.totalrooms;
            int available  = (int)(long)row.availableroomstoday;
            double occupancy = totalRooms > 0
                ? Math.Round((totalRooms - available) / (double)totalRooms * 100.0, 1)
                : 0;

            var byStatus = new Dictionary<string, int>();
            foreach (var s in statusRows)
                byStatus[s.status.ToString()] = (int)(long)s.cnt;

            var monthly = monthlyRows.Select(m => new MonthlyRevenue
            {
                Month   = m.month.ToString(),
                Revenue = (decimal)m.revenue,
                Count   = (int)(long)m.cnt,
            }).ToList();

            var recent = recentRows.Select(r => new RecentReservationItem
            {
                ReservationId = (int)(long)r.reservationid,
                ClientName    = r.clientname?.ToString(),
                RoomNumber    = r.roomnumber?.ToString(),
                CheckInDate   = (DateTime)r.checkindate,
                CheckOutDate  = (DateTime)r.checkoutdate,
                TotalPrice    = (decimal)r.totalprice,
                Status        = r.status?.ToString() ?? "",
            }).ToList();

            var topRooms = topRoomRows.Select(r => new TopRoomItem
            {
                RoomNumber    = r.roomnumber?.ToString(),
                RoomType      = r.roomtype?.ToString(),
                BookingCount  = (int)(long)r.bookingcount,
                TotalRevenue  = (decimal)r.totalrevenue,
            }).ToList();

            return new StatisticsData
            {
                TotalRooms           = totalRooms,
                AvailableRoomsToday  = available,
                OccupancyRateToday   = occupancy,
                TotalReservations    = (int)(long)row.totalreservations,
                ActiveReservations   = (int)(long)row.activereservations,
                TotalRevenue         = (decimal)row.totalrevenue,
                RevenueThisMonth     = (decimal)row.revenuethismonth,
                NewClientsThisMonth  = (int)(long)row.newclientsthismonth,
                ReservationsByStatus = byStatus,
                MonthlyRevenue       = monthly,
                RecentReservations   = recent,
                TopRooms             = topRooms,
            };
        }
    }
}
