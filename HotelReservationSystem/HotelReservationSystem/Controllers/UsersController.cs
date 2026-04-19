using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HotelReservation.Bll.DTOs;
using HotelReservation.Dal.Interfaces;

namespace HotelReservation.Api.Controllers
{
    public record SetLoyaltyDto(string Tier);

    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    [Authorize(Roles = "Admin")]
    public class UsersController : ControllerBase
    {
        private readonly IUnitOfWork _uow;
        private readonly ILogger<UsersController> _logger;

        public UsersController(IUnitOfWork uow, ILogger<UsersController> logger)
        {
            _uow = uow;
            _logger = logger;
        }

        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<UserAdminDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<UserAdminDto>>> GetAll(CancellationToken cancellationToken)
        {
            try
            {
                var users = await _uow.Users.GetAllAsync(cancellationToken);
                var dtos = new List<UserAdminDto>();
                foreach (var u in users)
                {
                    HotelReservation.Domain.Entities.Client? client = null;
                    int completedStays = 0;
                    if (u.ClientId.HasValue)
                    {
                        client = await _uow.Clients.GetByIdAsync(u.ClientId.Value, cancellationToken);
                        completedStays = await _uow.Reservations.CountCompletedStaysAsync(u.ClientId.Value, cancellationToken);

                        // Auto-upgrade to regular after 10 completed stays
                        if (completedStays >= 10 && client?.LoyaltyTier == "new")
                        {
                            await _uow.Clients.SetLoyaltyTierAsync(u.ClientId.Value, "regular", cancellationToken);
                            if (client != null) client.LoyaltyTier = "regular";
                        }
                    }
                    dtos.Add(new UserAdminDto
                    {
                        UserId = u.UserId, Email = u.Email, Role = u.Role.ToString(),
                        ClientId = u.ClientId, ClientName = client?.FullName,
                        CreatedAt = u.CreatedAt, IsBlocked = u.IsBlocked,
                        LoyaltyTier = client?.LoyaltyTier,
                        CompletedStays = completedStays
                    });
                }
                return Ok(dtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting users");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPost("{id:int}/block")]
        public async Task<IActionResult> Block(int id, CancellationToken cancellationToken)
        {
            try
            {
                await _uow.Users.SetBlockedAsync(id, true, cancellationToken);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error blocking user {Id}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPut("{id:int}/loyalty")]
        public async Task<IActionResult> SetLoyalty(int id, [FromBody] SetLoyaltyDto dto, CancellationToken cancellationToken)
        {
            var allowed = new[] { "new", "regular", "vip" };
            if (!allowed.Contains(dto.Tier))
                return BadRequest("Invalid tier");
            var user = (await _uow.Users.GetAllAsync(cancellationToken)).FirstOrDefault(u => u.UserId == id);
            if (user?.ClientId == null) return NotFound();
            await _uow.Clients.SetLoyaltyTierAsync(user.ClientId.Value, dto.Tier, cancellationToken);
            return NoContent();
        }

        [HttpPost("{id:int}/unblock")]
        public async Task<IActionResult> Unblock(int id, CancellationToken cancellationToken)
        {
            try
            {
                await _uow.Users.SetBlockedAsync(id, false, cancellationToken);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error unblocking user {Id}", id);
                return StatusCode(500, "Internal server error");
            }
        }
    }
}
