using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HotelReservation.Domain.Entities
{
    public class Reservation
    {
        public int ReservationId { get; set; }
        public int ClientId { get; set; }
        public int RoomId { get; set; }
        public DateTime CheckInDate { get; set; }
        public DateTime CheckOutDate { get; set; }
        public decimal TotalPrice { get; set; }
        public ReservationStatus Status { get; set; }
        public string? RoomNumber { get; set; }
        public string? ClientName { get; set; }
        public string? ClientLoyaltyTier { get; set; }

        public Client Client { get; set; } = null!;
        public Room Room { get; set; } = null!;
        public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    }

    public enum ReservationStatus
    {
        Pending = 0,
        Confirmed = 1,
        CheckedIn = 2,
        CheckedOut = 3,
        Cancelled = 4
    }
}