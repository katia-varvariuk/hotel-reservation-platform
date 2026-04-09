using HotelReservation.Domain.Entities;

namespace HotelReservation.Dal.Interfaces
{
    public interface IHotelServiceRepository
    {
        Task<IEnumerable<HotelService>> GetAllAsync(CancellationToken ct = default);
        Task<HotelService?> GetByIdAsync(int id, CancellationToken ct = default);
        Task<int> CreateAsync(HotelService service, CancellationToken ct = default);
        Task<bool> UpdateAsync(HotelService service, CancellationToken ct = default);
        Task<bool> DeleteAsync(int id, CancellationToken ct = default);
    }
}
