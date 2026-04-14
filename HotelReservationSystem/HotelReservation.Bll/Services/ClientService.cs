using AutoMapper;
using Microsoft.Extensions.Logging;
using HotelReservation.Bll.DTOs;
using HotelReservation.Bll.Services;
using HotelReservation.Dal.Interfaces;
using HotelReservation.Domain.Entities;
using HotelReservation.Domain.Exceptions;

namespace HotelReservation.Bll.Services
{
    public class ClientService : IClientService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly ILogger<ClientService> _logger;

        public ClientService(IUnitOfWork unitOfWork, IMapper mapper, ILogger<ClientService> logger)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<ClientDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Getting client with ID: {ClientId}", id);

            var client = await _unitOfWork.Clients.GetByIdAsync(id, cancellationToken);

            if (client == null)
            {
                _logger.LogWarning("Client with ID {ClientId} not found", id);
                return null;
            }

            return _mapper.Map<ClientDto>(client);
        }

        public async Task<IEnumerable<ClientDto>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Getting all clients");

            var clients = await _unitOfWork.Clients.GetAllAsync(cancellationToken);
            return _mapper.Map<IEnumerable<ClientDto>>(clients);
        }

        public async Task<ClientDto> CreateAsync(CreateClientDto createClientDto, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Creating new client with email: {Email}", createClientDto.Email);

            var existingClient = await _unitOfWork.Clients.GetByEmailAsync(createClientDto.Email, cancellationToken);
            if (existingClient != null)
            {
                throw new BusinessConflictException($"Client with email '{createClientDto.Email}' already exists");
            }

            var client = _mapper.Map<Client>(createClientDto);
            client.CreatedAt = DateTime.UtcNow;

            var clientId = await _unitOfWork.Clients.CreateAsync(client, cancellationToken);
            client.ClientId = clientId;

            _logger.LogInformation("Client created with ID: {ClientId}", clientId);

            return _mapper.Map<ClientDto>(client);
        }

        public async Task<ClientDto> UpdateAsync(UpdateClientDto updateClientDto, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Updating client with ID: {ClientId}", updateClientDto.ClientId);

            var existingClient = await _unitOfWork.Clients.GetByIdAsync(updateClientDto.ClientId, cancellationToken);
            if (existingClient == null)
            {
                throw new NotFoundException($"Client with ID {updateClientDto.ClientId} not found");
            }

            if (existingClient.Email != updateClientDto.Email)
            {
                var clientWithSameEmail = await _unitOfWork.Clients.GetByEmailAsync(updateClientDto.Email, cancellationToken);
                if (clientWithSameEmail != null)
                {
                    throw new BusinessConflictException($"Client with email '{updateClientDto.Email}' already exists");
                }
            }

            _mapper.Map(updateClientDto, existingClient);

            var isUpdated = await _unitOfWork.Clients.UpdateAsync(existingClient, cancellationToken);
            if (!isUpdated)
            {
                throw new BusinessConflictException($"Failed to update client with ID {updateClientDto.ClientId}");
            }

            _logger.LogInformation("Client with ID {ClientId} updated successfully", updateClientDto.ClientId);

            return _mapper.Map<ClientDto>(existingClient);
        }

        public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Deleting client with ID: {ClientId}", id);

            var client = await _unitOfWork.Clients.GetByIdAsync(id, cancellationToken);
            if (client == null)
            {
                throw new NotFoundException($"Client with ID {id} not found");
            }

            var activeReservations = await _unitOfWork.Reservations.GetByClientIdAsync(id, cancellationToken);
            var hasActiveReservations = activeReservations.Any(r =>
                r.Status == ReservationStatus.Pending ||
                r.Status == ReservationStatus.Confirmed ||
                r.Status == ReservationStatus.CheckedIn);

            if (hasActiveReservations)
            {
                throw new BusinessConflictException("Cannot delete client with active reservations");
            }

            var isDeleted = await _unitOfWork.Clients.DeleteAsync(id, cancellationToken);

            if (isDeleted)
            {
                _logger.LogInformation("Client with ID {ClientId} deleted successfully", id);
            }

            return isDeleted;
        }

        public async Task<ClientDto?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Getting client by email: {Email}", email);

            var client = await _unitOfWork.Clients.GetByEmailAsync(email, cancellationToken);
            return client != null ? _mapper.Map<ClientDto>(client) : null;
        }

        public async Task<IEnumerable<ClientDto>> SearchAsync(string searchTerm, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Searching clients with term: {SearchTerm}", searchTerm);

            if (string.IsNullOrWhiteSpace(searchTerm))
            {
                throw new ValidationException("Search term cannot be empty");
            }

            var clients = await _unitOfWork.Clients.SearchAsync(searchTerm, cancellationToken);
            return _mapper.Map<IEnumerable<ClientDto>>(clients);
        }
    }
}