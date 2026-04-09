using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using HotelReservation.Domain.Entities;

namespace HotelReservation.Dal.Interfaces
{
    public interface IClientRepository : IRepository<Client>
    {
        Task<Client?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);
        Task<IEnumerable<Client>> SearchAsync(string searchTerm, CancellationToken cancellationToken = default);
        Task<bool> SetLoyaltyTierAsync(int clientId, string tier, CancellationToken cancellationToken = default);
    }
}