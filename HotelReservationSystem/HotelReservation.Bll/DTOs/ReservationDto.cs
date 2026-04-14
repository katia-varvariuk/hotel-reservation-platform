using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;
using HotelReservation.Domain.Entities;

namespace HotelReservation.Bll.DTOs
{
    public class ReservationDto
    {
        public int ReservationId { get; set; }
        public int ClientId { get; set; }
        public int RoomId { get; set; }

        [Required(ErrorMessage = "Check-in date is required")]
        public DateTime CheckInDate { get; set; }

        [Required(ErrorMessage = "Check-out date is required")]
        public DateTime CheckOutDate { get; set; }

        public decimal TotalPrice { get; set; }
        public ReservationStatus Status { get; set; }
        public string? RoomNumber { get; set; }
        public string? ClientName { get; set; }
        public string? ClientLoyaltyTier { get; set; }

        public ClientDto? Client { get; set; }
        public RoomDto? Room { get; set; }
        public List<PaymentDto> Payments { get; set; } = new();
    }

    public class CreateReservationDto
    {
        [Required(ErrorMessage = "Client ID is required")]
        public int ClientId { get; set; }

        [Required(ErrorMessage = "Room ID is required")]
        public int RoomId { get; set; }

        [Required(ErrorMessage = "Check-in date is required")]
        public DateTime CheckInDate { get; set; }

        [Required(ErrorMessage = "Check-out date is required")]
        public DateTime CheckOutDate { get; set; }

        public decimal AdditionalServicesPrice { get; set; } = 0;

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (CheckInDate >= CheckOutDate)
            {
                yield return new ValidationResult(
                    "Check-out date must be after check-in date",
                    new[] { nameof(CheckOutDate) });
            }

            if (CheckInDate < DateTime.Today)
            {
                yield return new ValidationResult(
                    "Check-in date cannot be in the past",
                    new[] { nameof(CheckInDate) });
            }
        }
    }

    public class UpdateReservationStatusDto
    {
        [Required(ErrorMessage = "Reservation ID is required")]
        public int ReservationId { get; set; }

        [Required(ErrorMessage = "Status is required")]
        public ReservationStatus Status { get; set; }
    }
}