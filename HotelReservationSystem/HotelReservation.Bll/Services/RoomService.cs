using AutoMapper;
using Microsoft.Extensions.Logging;
using HotelReservation.Bll.DTOs;
using HotelReservation.Bll.Services;
using HotelReservation.Dal.Interfaces;
using HotelReservation.Domain.Entities;
using HotelReservation.Domain.Exceptions;

namespace HotelReservation.Bll.Services
{
    public class RoomService : IRoomService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly ILogger<RoomService> _logger;

        private readonly IPricingService _pricingService;

        public RoomService(IUnitOfWork unitOfWork, IMapper mapper, ILogger<RoomService> logger, IPricingService pricingService)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _logger = logger;
            _pricingService = pricingService;
        }

        public async Task<RoomDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Getting room with ID: {RoomId}", id);

            var room = await _unitOfWork.Rooms.GetByIdAsync(id, cancellationToken);

            if (room == null)
            {
                _logger.LogWarning("Room with ID {RoomId} not found", id);
                return null;
            }

            return _mapper.Map<RoomDto>(room);
        }

        public async Task<IEnumerable<RoomDto>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Getting all rooms");

            var rooms = await _unitOfWork.Rooms.GetAllAsync(cancellationToken);
            return _mapper.Map<IEnumerable<RoomDto>>(rooms);
        }

        public async Task<RoomDto> CreateAsync(CreateRoomDto createRoomDto, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Creating new room with number: {RoomNumber}", createRoomDto.RoomNumber);

            var existingRoom = await _unitOfWork.Rooms.GetByRoomNumberAsync(createRoomDto.RoomNumber, cancellationToken);
            if (existingRoom != null)
            {
                throw new BusinessConflictException($"Room with number '{createRoomDto.RoomNumber}' already exists");
            }

            ValidateRoomData(createRoomDto.Capacity, createRoomDto.Price);

            var room = _mapper.Map<Room>(createRoomDto);

            var roomId = await _unitOfWork.Rooms.CreateAsync(room, cancellationToken);
            room.RoomId = roomId;

            _logger.LogInformation("Room created with ID: {RoomId}", roomId);

            return _mapper.Map<RoomDto>(room);
        }

        public async Task<RoomDto> UpdateAsync(RoomDto roomDto, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Updating room with ID: {RoomId}", roomDto.RoomId);

            var existingRoom = await _unitOfWork.Rooms.GetByIdAsync(roomDto.RoomId, cancellationToken);
            if (existingRoom == null)
            {
                throw new NotFoundException($"Room with ID {roomDto.RoomId} not found");
            }

            if (existingRoom.RoomNumber != roomDto.RoomNumber)
            {
                var roomWithSameNumber = await _unitOfWork.Rooms.GetByRoomNumberAsync(roomDto.RoomNumber, cancellationToken);
                if (roomWithSameNumber != null)
                {
                    throw new BusinessConflictException($"Room with number '{roomDto.RoomNumber}' already exists");
                }
            }

            ValidateRoomData(roomDto.Capacity, roomDto.Price);

            if (roomDto.Capacity < existingRoom.Capacity)
            {
                var activeReservations = await GetActiveReservationsForRoom(roomDto.RoomId, cancellationToken);
                if (activeReservations.Any())
                {
                    throw new BusinessConflictException("Cannot reduce room capacity while there are active reservations");
                }
            }

            var oldPrice = existingRoom.Price;
            _mapper.Map(roomDto, existingRoom);

            var isUpdated = await _unitOfWork.Rooms.UpdateAsync(existingRoom, cancellationToken);
            if (!isUpdated)
            {
                throw new BusinessConflictException($"Failed to update room with ID {roomDto.RoomId}");
            }

            if (oldPrice != existingRoom.Price)
            {
                await _unitOfWork.PriceHistories.CreateAsync(new Domain.Entities.PriceHistory
                {
                    RoomId = existingRoom.RoomId,
                    OldPrice = oldPrice,
                    NewPrice = existingRoom.Price,
                    Reason = "Manual price update",
                    ChangedAt = DateTime.UtcNow
                }, cancellationToken);
            }

            _logger.LogInformation("Room with ID {RoomId} updated successfully", roomDto.RoomId);

            return _mapper.Map<RoomDto>(existingRoom);
        }

        public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Deleting room with ID: {RoomId}", id);

            var room = await _unitOfWork.Rooms.GetByIdAsync(id, cancellationToken);
            if (room == null)
            {
                throw new NotFoundException($"Room with ID {id} not found");
            }

            var activeReservations = await GetActiveReservationsForRoom(id, cancellationToken);
            if (activeReservations.Any())
            {
                throw new BusinessConflictException("Cannot delete room with active or future reservations");
            }

            var isDeleted = await _unitOfWork.Rooms.DeleteAsync(id, cancellationToken);

            if (isDeleted)
            {
                _logger.LogInformation("Room with ID {RoomId} deleted successfully", id);
            }

            return isDeleted;
        }

        public async Task<IEnumerable<AvailableRoomDto>> GetAvailableRoomsAsync(DateTime checkIn, DateTime checkOut,
            string? roomType = null, int? minCapacity = null, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Getting available rooms for dates: {CheckIn} - {CheckOut}", checkIn, checkOut);

            if (checkIn >= checkOut)
                throw new ValidationException("Check-out date must be after check-in date");

            if (checkIn < DateTime.Today)
                throw new ValidationException("Check-in date cannot be in the past");

            var availableRooms = await _unitOfWork.Rooms.GetAvailableRoomsAsync(
                checkIn, checkOut, roomType, minCapacity, cancellationToken);

            var nights = (checkOut - checkIn).Days;
            var result = new List<AvailableRoomDto>();

            foreach (var room in availableRooms)
            {
                var dto = _mapper.Map<AvailableRoomDto>(room);
                dto.IsAvailable = true;
                dto.Nights = nights;
                dto.CalculatedPrice = await _pricingService.CalculatePriceAsync(
                    room.RoomId, checkIn, checkOut, cancellationToken);
                result.Add(dto);
            }

            _logger.LogInformation("Found {Count} available rooms", result.Count);
            return result;
        }

        public async Task<RoomDto?> GetByRoomNumberAsync(string roomNumber, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Getting room by number: {RoomNumber}", roomNumber);

            if (string.IsNullOrWhiteSpace(roomNumber))
            {
                throw new ValidationException("Room number cannot be empty");
            }

            var room = await _unitOfWork.Rooms.GetByRoomNumberAsync(roomNumber, cancellationToken);
            return room != null ? _mapper.Map<RoomDto>(room) : null;
        }

        private static void ValidateRoomData(int capacity, decimal price)
        {
            if (capacity <= 0 || capacity > 10)
            {
                throw new ValidationException("Room capacity must be between 1 and 10");
            }

            if (price <= 0)
            {
                throw new ValidationException("Room price must be greater than 0");
            }

            if (price > 10000) 
            {
                throw new ValidationException("Room price cannot exceed 10,000");
            }
        }

        private async Task<IEnumerable<Reservation>> GetActiveReservationsForRoom(int roomId, CancellationToken cancellationToken)
        {
            var allReservations = await _unitOfWork.Reservations.GetAllAsync(cancellationToken);
            return allReservations.Where(r =>
                r.RoomId == roomId &&
                (r.Status == ReservationStatus.Pending ||
                 r.Status == ReservationStatus.Confirmed ||
                 r.Status == ReservationStatus.CheckedIn ||
                 (r.Status == ReservationStatus.CheckedOut && r.CheckOutDate > DateTime.Today)));
        }
    }
}