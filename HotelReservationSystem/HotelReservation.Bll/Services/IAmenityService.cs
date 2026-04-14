using HotelReservation.Bll.DTOs;

namespace HotelReservation.Bll.Services
{
    public interface IAmenityService
    {
        Task<IEnumerable<AmenityDto>> GetAllAsync(CancellationToken ct = default);
        Task<AmenityDto?> GetByIdAsync(int id, CancellationToken ct = default);
        Task<AmenityDto> CreateAsync(CreateAmenityDto dto, CancellationToken ct = default);
        Task<AmenityDto> UpdateAsync(int id, CreateAmenityDto dto, CancellationToken ct = default);
        Task DeleteAsync(int id, CancellationToken ct = default);

        Task<IEnumerable<AmenityDto>> GetByRoomIdAsync(int roomId, CancellationToken ct = default);
        Task SetRoomAmenitiesAsync(int roomId, SetRoomAmenitiesDto dto, CancellationToken ct = default);
    }
}
