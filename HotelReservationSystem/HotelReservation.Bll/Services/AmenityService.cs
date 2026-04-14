using HotelReservation.Bll.DTOs;
using HotelReservation.Dal.Interfaces;
using HotelReservation.Domain.Entities;
using HotelReservation.Domain.Exceptions;

namespace HotelReservation.Bll.Services
{
    public class AmenityService : IAmenityService
    {
        private readonly IAmenityRepository _repo;

        public AmenityService(IAmenityRepository repo) => _repo = repo;

        public async Task<IEnumerable<AmenityDto>> GetAllAsync(CancellationToken ct = default)
        {
            var items = await _repo.GetAllAsync(ct);
            return items.Select(ToDto);
        }

        public async Task<AmenityDto?> GetByIdAsync(int id, CancellationToken ct = default)
        {
            var a = await _repo.GetByIdAsync(id, ct);
            return a is null ? null : ToDto(a);
        }

        public async Task<AmenityDto> CreateAsync(CreateAmenityDto dto, CancellationToken ct = default)
        {
            var entity = new Amenity { Name = dto.Name.Trim(), Icon = dto.Icon.Trim() };
            entity.AmenityId = await _repo.CreateAsync(entity, ct);
            return ToDto(entity);
        }

        public async Task<AmenityDto> UpdateAsync(int id, CreateAmenityDto dto, CancellationToken ct = default)
        {
            var existing = await _repo.GetByIdAsync(id, ct)
                ?? throw new NotFoundException($"Amenity {id} not found");
            existing.Name = dto.Name.Trim();
            existing.Icon = dto.Icon.Trim();
            await _repo.UpdateAsync(existing, ct);
            return ToDto(existing);
        }

        public async Task DeleteAsync(int id, CancellationToken ct = default)
        {
            var deleted = await _repo.DeleteAsync(id, ct);
            if (!deleted) throw new NotFoundException($"Amenity {id} not found");
        }

        public async Task<IEnumerable<AmenityDto>> GetByRoomIdAsync(int roomId, CancellationToken ct = default)
        {
            var items = await _repo.GetByRoomIdAsync(roomId, ct);
            return items.Select(ToDto);
        }

        public async Task SetRoomAmenitiesAsync(int roomId, SetRoomAmenitiesDto dto, CancellationToken ct = default)
        {
            await _repo.SetRoomAmenitiesAsync(roomId, dto.AmenityIds, ct);
        }

        private static AmenityDto ToDto(Amenity a) => new() { AmenityId = a.AmenityId, Name = a.Name, Icon = a.Icon };
    }
}
