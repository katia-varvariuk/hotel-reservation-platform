using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using HotelReservation.Bll.DTOs;

namespace HotelReservation.Bll.Services
{
    public interface IPaymentService
    {
        Task<PaymentDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
        Task<IEnumerable<PaymentDto>> GetAllAsync(CancellationToken cancellationToken = default);
        Task<PaymentDto> CreateAsync(CreatePaymentDto createPaymentDto, CancellationToken cancellationToken = default);
        Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);
        Task<IEnumerable<PaymentDto>> GetByReservationIdAsync(int reservationId, CancellationToken cancellationToken = default);
        Task<PaymentDto> ProcessPaymentAsync(CreatePaymentDto createPaymentDto, CancellationToken cancellationToken = default);
    }
}