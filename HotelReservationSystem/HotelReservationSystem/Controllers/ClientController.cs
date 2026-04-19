using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HotelReservation.Bll.DTOs;
using HotelReservation.Bll.Services;
using HotelReservation.Domain.Exceptions;

namespace HotelReservation.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    [Authorize]
    public class ClientController : ControllerBase
    {
        private readonly IClientService _clientService;
        private readonly ILogger<ClientController> _logger;
        private readonly IWebHostEnvironment _env;

        public ClientController(IClientService clientService, ILogger<ClientController> logger, IWebHostEnvironment env)
        {
            _clientService = clientService;
            _logger = logger;
            _env = env;
        }

        [Authorize(Roles = "Admin")]
        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<ClientDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<ClientDto>>> GetAllClients(CancellationToken cancellationToken)
        {
            try
            {
                var clients = await _clientService.GetAllAsync(cancellationToken);
                return Ok(clients);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all clients");
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
            }
        }

        [Authorize(Roles = "Admin,Client")]
        [HttpGet("{id:int}")]
        [ProducesResponseType(typeof(ClientDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ClientDto>> GetClient(int id, CancellationToken cancellationToken)
        {
            try
            {
                var client = await _clientService.GetByIdAsync(id, cancellationToken);

                if (client == null)
                {
                    return NotFound($"Client with ID {id} not found");
                }

                return Ok(client);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting client with ID {ClientId}", id);
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
            }
        }

        
        [Authorize(Roles = "Admin")]
        [HttpPost]
        [ProducesResponseType(typeof(ClientDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<ActionResult<ClientDto>> CreateClient([FromBody] CreateClientDto createClientDto, CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var client = await _clientService.CreateAsync(createClientDto, cancellationToken);
                return CreatedAtAction(nameof(GetClient), new { id = client.ClientId }, client);
            }
            catch (BusinessConflictException ex)
            {
                return Conflict(ex.Message);
            }
            catch (ValidationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating client");
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
            }
        }

        [Authorize(Roles = "Admin,Client")]
        [HttpPut("{id:int}")]
        [ProducesResponseType(typeof(ClientDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<ActionResult<ClientDto>> UpdateClient(int id, [FromBody] UpdateClientDto updateClientDto, CancellationToken cancellationToken)
        {
            if (id != updateClientDto.ClientId)
            {
                return BadRequest("Client ID in URL doesn't match the ID in request body");
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var client = await _clientService.UpdateAsync(updateClientDto, cancellationToken);
                return Ok(client);
            }
            catch (NotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (BusinessConflictException ex)
            {
                return Conflict(ex.Message);
            }
            catch (ValidationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating client with ID {ClientId}", id);
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> DeleteClient(int id, CancellationToken cancellationToken)
        {
            try
            {
                var isDeleted = await _clientService.DeleteAsync(id, cancellationToken);

                if (isDeleted)
                {
                    return NoContent();
                }

                return NotFound($"Client with ID {id} not found");
            }
            catch (NotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (BusinessConflictException ex)
            {
                return Conflict(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting client with ID {ClientId}", id);
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("search")]
        [ProducesResponseType(typeof(IEnumerable<ClientDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<IEnumerable<ClientDto>>> SearchClients([FromQuery] string searchTerm, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(searchTerm))
            {
                return BadRequest("Search term is required");
            }

            try
            {
                var clients = await _clientService.SearchAsync(searchTerm, cancellationToken);
                return Ok(clients);
            }
            catch (ValidationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching clients with term: {SearchTerm}", searchTerm);
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
            }
        }

        
        [Authorize(Roles = "Admin")]
        [HttpGet("by-email")]
        [ProducesResponseType(typeof(ClientDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<ClientDto>> GetClientByEmail([FromQuery] string email, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(email))
            {
                return BadRequest("Email is required");
            }

            try
            {
                var client = await _clientService.GetByEmailAsync(email, cancellationToken);

                if (client == null)
                {
                    return NotFound($"Client with email '{email}' not found");
                }

                return Ok(client);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting client by email: {Email}", email);
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
            }
        }

        [Authorize(Roles = "Admin,Client")]
        [HttpPost("{id:int}/avatar")]
        [Consumes("multipart/form-data")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UploadAvatar(int id, IFormFile avatar, CancellationToken cancellationToken)
        {
            if (avatar == null || avatar.Length == 0)
                return BadRequest("No file provided");

            var allowed = new[] { "image/jpeg", "image/png", "image/gif", "image/webp" };
            if (!allowed.Contains(avatar.ContentType.ToLower()))
                return BadRequest("Only image files are allowed");

            if (avatar.Length > 5 * 1024 * 1024)
                return BadRequest("File size must be less than 5 MB");

            try
            {
                var client = await _clientService.GetByIdAsync(id, cancellationToken);
                if (client == null) return NotFound();

                var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                var uploadsDir = Path.Combine(webRoot, "uploads", "avatars");
                Directory.CreateDirectory(uploadsDir);

                var ext = Path.GetExtension(avatar.FileName).ToLower();
                if (string.IsNullOrEmpty(ext)) ext = ".jpg";
                var fileName = $"{id}_{Guid.NewGuid():N}{ext}";
                var filePath = Path.Combine(uploadsDir, fileName);

                await using (var stream = new FileStream(filePath, FileMode.Create))
                    await avatar.CopyToAsync(stream, cancellationToken);

                var baseUrl = $"{Request.Scheme}://{Request.Host}";
                var avatarUrl = $"{baseUrl}/uploads/avatars/{fileName}";

                await _clientService.UpdateAsync(new UpdateClientDto
                {
                    ClientId = id,
                    FullName = client.FullName,
                    Phone = client.Phone ?? "",
                    Email = client.Email,
                    PassportData = client.PassportData ?? "",
                    AvatarUrl = avatarUrl
                }, cancellationToken);

                return Ok(new { avatarUrl });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading avatar for client {ClientId}", id);
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
            }
        }
    }
}