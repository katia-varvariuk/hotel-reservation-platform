using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using HotelReservation.Domain.Entities;

namespace HotelReservation.Dal.Interfaces
{
    public interface IPaymentRepository : IRepository<Payment>
    {
        Task<IEnumerable<Payment>> GetByReservationIdAsync(int reservationId, CancellationToken cancellationToken = default);
    }
}
