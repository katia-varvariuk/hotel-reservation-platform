using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HotelReservation.Dal.Interfaces;

namespace HotelReservation.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    [Authorize(Roles = "Client")]
    public class FavoriteController : ControllerBase
    {
        private readonly IUnitOfWork _uow;

        public FavoriteController(IUnitOfWork uow) => _uow = uow;

        [HttpGet]
        public async Task<ActionResult<IEnumerable<int>>> GetMyFavorites(CancellationToken cancellationToken)
        {
            var clientId = GetClientId();
            if (clientId == null) return Unauthorized();
            var ids = await _uow.Favorites.GetRoomIdsByClientAsync(clientId.Value, cancellationToken);
            return Ok(ids);
        }

        [HttpPost("{roomId:int}")]
        public async Task<IActionResult> Add(int roomId, CancellationToken cancellationToken)
        {
            var clientId = GetClientId();
            if (clientId == null) return Unauthorized();
            await _uow.Favorites.AddAsync(clientId.Value, roomId, cancellationToken);
            return Ok();
        }

        [HttpDelete("{roomId:int}")]
        public async Task<IActionResult> Remove(int roomId, CancellationToken cancellationToken)
        {
            var clientId = GetClientId();
            if (clientId == null) return Unauthorized();
            await _uow.Favorites.RemoveAsync(clientId.Value, roomId, cancellationToken);
            return NoContent();
        }

        private int? GetClientId()
        {
            var val = User.FindFirstValue("clientId");
            return int.TryParse(val, out var id) && id > 0 ? id : null;
        }
    }
}
