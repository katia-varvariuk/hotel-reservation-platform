using HotelReservation.Bll.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using HotelReservation.Bll.DTOs;

namespace HotelReservation.Bll.Services
{
    public interface IClientService
    {
        Task<ClientDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
        Task<IEnumerable<ClientDto>> GetAllAsync(CancellationToken cancellationToken = default);
        Task<ClientDto> CreateAsync(CreateClientDto createClientDto, CancellationToken cancellationToken = default);
        Task<ClientDto> UpdateAsync(UpdateClientDto updateClientDto, CancellationToken cancellationToken = default);
        Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);
        Task<ClientDto?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);
        Task<IEnumerable<ClientDto>> SearchAsync(string searchTerm, CancellationToken cancellationToken = default);
    }
}