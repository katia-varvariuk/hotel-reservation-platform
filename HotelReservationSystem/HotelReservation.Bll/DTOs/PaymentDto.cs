using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;
namespace HotelReservation.Bll.DTOs
{
    public class PaymentDto
    {
        public int PaymentId { get; set; }
        public int ReservationId { get; set; }

        [Range(0.01, double.MaxValue, ErrorMessage = "Amount must be greater than 0")]
        public decimal Amount { get; set; }

        public DateTime PaymentDate { get; set; }

        [Required(ErrorMessage = "Payment method is required")]
        [StringLength(20, ErrorMessage = "Payment method cannot exceed 20 characters")]
        public string Method { get; set; } = string.Empty;
    }

    public class CreatePaymentDto
    {
        [Required(ErrorMessage = "Reservation ID is required")]
        public int ReservationId { get; set; }

        [Range(0.01, double.MaxValue, ErrorMessage = "Amount must be greater than 0")]
        public decimal Amount { get; set; }

        [Required(ErrorMessage = "Payment method is required")]
        [StringLength(20, ErrorMessage = "Payment method cannot exceed 20 characters")]
        public string Method { get; set; } = string.Empty;
    }
}