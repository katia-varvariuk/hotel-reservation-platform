using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using HotelReservation.Domain.Entities;

namespace HotelReservation.Dal.Interfaces
{
    public interface IRoomRepository : IRepository<Room>
    {
        Task<IEnumerable<Room>> GetAvailableRoomsAsync(DateTime checkIn, DateTime checkOut,
            string? roomType = null, int? minCapacity = null, CancellationToken cancellationToken = default);
        Task<Room?> GetByRoomNumberAsync(string roomNumber, CancellationToken cancellationToken = default);
    }
}