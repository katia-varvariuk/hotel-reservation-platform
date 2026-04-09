using HotelReservation.Domain.Entities;

namespace HotelReservation.Dal.Interfaces
{
    public interface IAmenityRepository
    {
        Task<IEnumerable<Amenity>> GetAllAsync(CancellationToken ct = default);
        Task<Amenity?> GetByIdAsync(int id, CancellationToken ct = default);
        Task<int> CreateAsync(Amenity amenity, CancellationToken ct = default);
        Task<bool> UpdateAsync(Amenity amenity, CancellationToken ct = default);
        Task<bool> DeleteAsync(int id, CancellationToken ct = default);

        Task<IEnumerable<Amenity>> GetByRoomIdAsync(int roomId, CancellationToken ct = default);
        Task SetRoomAmenitiesAsync(int roomId, IEnumerable<int> amenityIds, CancellationToken ct = default);
    }
}
