using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using HotelReservation.Bll.DTOs;
using HotelReservation.Domain.Entities;

namespace HotelReservation.Bll.Services
{
    public interface IReservationService
    {
        Task<ReservationDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
        Task<IEnumerable<ReservationDto>> GetAllAsync(CancellationToken cancellationToken = default);
        Task<ReservationDto> CreateAsync(CreateReservationDto createReservationDto, CancellationToken cancellationToken = default);
        Task<ReservationDto> UpdateStatusAsync(UpdateReservationStatusDto updateStatusDto, CancellationToken cancellationToken = default);
        Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);
        Task<IEnumerable<ReservationDto>> GetByClientIdAsync(int clientId, CancellationToken cancellationToken = default);
        Task<ReservationDto?> GetWithDetailsAsync(int id, CancellationToken cancellationToken = default);
        Task<IEnumerable<ReservationDto>> GetByDateRangeAsync(DateTime from, DateTime to, CancellationToken cancellationToken = default);
        Task<ReservationDto> ConfirmAsync(int reservationId, CancellationToken cancellationToken = default);
        Task<ReservationDto> CheckInAsync(int reservationId, CancellationToken cancellationToken = default);
        Task<ReservationDto> CheckOutAsync(int reservationId, CancellationToken cancellationToken = default);
        Task<ReservationDto> CancelAsync(int reservationId, CancellationToken cancellationToken = default);
    }
}