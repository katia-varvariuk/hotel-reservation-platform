using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using HotelReservation.Bll.DTOs;

namespace HotelReservation.Bll.Services
{
    public interface IRoomService
    {
        Task<RoomDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
        Task<IEnumerable<RoomDto>> GetAllAsync(CancellationToken cancellationToken = default);
        Task<RoomDto> CreateAsync(CreateRoomDto createRoomDto, CancellationToken cancellationToken = default);
        Task<RoomDto> UpdateAsync(RoomDto roomDto, CancellationToken cancellationToken = default);
        Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);
        Task<IEnumerable<AvailableRoomDto>> GetAvailableRoomsAsync(DateTime checkIn, DateTime checkOut,
            string? roomType = null, int? minCapacity = null, CancellationToken cancellationToken = default);
        Task<RoomDto?> GetByRoomNumberAsync(string roomNumber, CancellationToken cancellationToken = default);
    }
}