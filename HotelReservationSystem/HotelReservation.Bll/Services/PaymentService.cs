using AutoMapper;
using Microsoft.Extensions.Logging;
using HotelReservation.Bll.DTOs;
using HotelReservation.Bll.Services;
using HotelReservation.Dal.Interfaces;
using HotelReservation.Domain.Entities;
using HotelReservation.Domain.Exceptions;

namespace HotelReservation.Bll.Services
{
    public class PaymentService : IPaymentService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly ILogger<PaymentService> _logger;

        private static readonly string[] ValidPaymentMethods = { "Cash", "Card", "Transfer", "Online" };

        public PaymentService(IUnitOfWork unitOfWork, IMapper mapper, ILogger<PaymentService> logger)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<PaymentDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Getting payment with ID: {PaymentId}", id);

            var payment = await _unitOfWork.Payments.GetByIdAsync(id, cancellationToken);

            if (payment == null)
            {
                _logger.LogWarning("Payment with ID {PaymentId} not found", id);
                return null;
            }

            return _mapper.Map<PaymentDto>(payment);
        }

        public async Task<IEnumerable<PaymentDto>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Getting all payments");

            var payments = await _unitOfWork.Payments.GetAllAsync(cancellationToken);
            return _mapper.Map<IEnumerable<PaymentDto>>(payments);
        }

        public async Task<PaymentDto> CreateAsync(CreatePaymentDto createPaymentDto, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Creating payment for reservation ID: {ReservationId}, Amount: {Amount}",
                createPaymentDto.ReservationId, createPaymentDto.Amount);

            ValidatePaymentMethod(createPaymentDto.Method);

            var reservation = await _unitOfWork.Reservations.GetByIdAsync(createPaymentDto.ReservationId, cancellationToken);
            if (reservation == null)
            {
                throw new NotFoundException($"Reservation with ID {createPaymentDto.ReservationId} not found");
            }

            if (reservation.Status == ReservationStatus.Cancelled)
            {
                throw new BusinessConflictException("Cannot create payment for cancelled reservation");
            }

            var payment = _mapper.Map<Payment>(createPaymentDto);
            payment.PaymentDate = DateTime.UtcNow;

            var paymentId = await _unitOfWork.Payments.CreateAsync(payment, cancellationToken);
            payment.PaymentId = paymentId;

            _logger.LogInformation("Payment created with ID: {PaymentId}", paymentId);

            return _mapper.Map<PaymentDto>(payment);
        }

        public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Deleting payment with ID: {PaymentId}", id);

            var payment = await _unitOfWork.Payments.GetByIdAsync(id, cancellationToken);
            if (payment == null)
            {
                throw new NotFoundException($"Payment with ID {id} not found");
            }

            var maxDeletionPeriod = TimeSpan.FromDays(1);
            if (DateTime.UtcNow - payment.PaymentDate > maxDeletionPeriod)
            {
                throw new BusinessConflictException("Cannot delete payments older than 1 day");
            }

            var isDeleted = await _unitOfWork.Payments.DeleteAsync(id, cancellationToken);

            if (isDeleted)
            {
                _logger.LogInformation("Payment with ID {PaymentId} deleted successfully", id);
            }

            return isDeleted;
        }

        public async Task<IEnumerable<PaymentDto>> GetByReservationIdAsync(int reservationId, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Getting payments for reservation ID: {ReservationId}", reservationId);

            var payments = await _unitOfWork.Payments.GetByReservationIdAsync(reservationId, cancellationToken);
            return _mapper.Map<IEnumerable<PaymentDto>>(payments);
        }

        public async Task<PaymentDto> ProcessPaymentAsync(CreatePaymentDto createPaymentDto, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Processing payment for reservation ID: {ReservationId}", createPaymentDto.ReservationId);

            await _unitOfWork.BeginTransactionAsync(cancellationToken);

            try
            {
                var payment = await CreateAsync(createPaymentDto, cancellationToken);

                var reservation = await _unitOfWork.Reservations.GetWithDetailsAsync(createPaymentDto.ReservationId, cancellationToken);
                if (reservation == null)
                {
                    throw new NotFoundException($"Reservation with ID {createPaymentDto.ReservationId} not found");
                }

                var existingPayments = await _unitOfWork.Payments.GetByReservationIdAsync(createPaymentDto.ReservationId, cancellationToken);
                var totalPaid = existingPayments.Sum(p => p.Amount);

                var reservationCost = CalculateReservationCost(reservation);

                _logger.LogInformation("Reservation cost: {Cost}, Total paid: {TotalPaid}", reservationCost, totalPaid);

                if (totalPaid >= reservationCost && reservation.Status == ReservationStatus.Pending)
                {
                    await _unitOfWork.Reservations.UpdateStatusAsync(
                        createPaymentDto.ReservationId,
                        ReservationStatus.Confirmed,
                        cancellationToken);

                    _logger.LogInformation("Reservation {ReservationId} confirmed after full payment", createPaymentDto.ReservationId);
                }

                await _unitOfWork.CommitAsync(cancellationToken);

                _logger.LogInformation("Payment processed successfully for reservation ID: {ReservationId}", createPaymentDto.ReservationId);

                return payment;
            }
            catch
            {
                await _unitOfWork.RollbackAsync(cancellationToken);
                throw;
            }
        }

        private static void ValidatePaymentMethod(string method)
        {
            if (string.IsNullOrWhiteSpace(method))
            {
                throw new ValidationException("Payment method is required");
            }

            if (!ValidPaymentMethods.Contains(method, StringComparer.OrdinalIgnoreCase))
            {
                throw new ValidationException($"Invalid payment method. Allowed methods: {string.Join(", ", ValidPaymentMethods)}");
            }
        }

        private static decimal CalculateReservationCost(Reservation reservation)
        {
            if (reservation.Room == null)
            {
                throw new InvalidOperationException("Room information is required to calculate cost");
            }

            var nights = (reservation.CheckOutDate - reservation.CheckInDate).Days;
            if (nights <= 0)
            {
                throw new ValidationException("Invalid reservation dates");
            }

            return nights * reservation.Room.Price;
        }
    }
}