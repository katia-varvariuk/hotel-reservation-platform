using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using HotelReservation.Domain.Entities;

namespace HotelReservation.Dal.Interfaces
{
    public interface IReservationRepository : IRepository<Reservation>
    {
        Task<IEnumerable<Reservation>> GetByClientIdAsync(int clientId, CancellationToken cancellationToken = default);
        Task<Reservation?> GetWithDetailsAsync(int reservationId, CancellationToken cancellationToken = default);
        Task<bool> UpdateStatusAsync(int reservationId, ReservationStatus status, CancellationToken cancellationToken = default);
        Task<IEnumerable<Reservation>> GetByDateRangeAsync(DateTime from, DateTime to, CancellationToken cancellationToken = default);
        Task<bool> HasClientStayedAsync(int clientId, int roomId, CancellationToken cancellationToken = default);
        Task<int> CountCompletedStaysAsync(int clientId, CancellationToken cancellationToken = default);
    }
}