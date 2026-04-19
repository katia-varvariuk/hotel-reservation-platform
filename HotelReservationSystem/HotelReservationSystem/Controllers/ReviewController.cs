using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HotelReservation.Bll.DTOs;
using HotelReservation.Dal.Interfaces;
using HotelReservation.Domain.Entities;

namespace HotelReservation.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class ReviewController : ControllerBase
    {
        private readonly IUnitOfWork _uow;
        private readonly ILogger<ReviewController> _logger;

        public ReviewController(IUnitOfWork uow, ILogger<ReviewController> logger)
        {
            _uow = uow;
            _logger = logger;
        }

        [HttpGet("room/{roomId:int}")]
        [ProducesResponseType(typeof(IEnumerable<ReviewDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<ReviewDto>>> GetByRoom(int roomId, CancellationToken cancellationToken)
        {
            try
            {
                var reviews = await _uow.Reviews.GetByRoomIdAsync(roomId, cancellationToken);
                var dtos = reviews.Select(r => new ReviewDto
                {
                    ReviewId = r.ReviewId, ClientId = r.ClientId, RoomId = r.RoomId,
                    Rating = r.Rating, Comment = r.Comment, CreatedAt = r.CreatedAt,
                    ClientName = r.ClientName, AvatarUrl = r.AvatarUrl
                });
                return Ok(dtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting reviews for room {RoomId}", roomId);
                return StatusCode(500, "Internal server error");
            }
        }

        [Authorize(Roles = "Client")]
        [HttpGet("can-review/{roomId:int}")]
        [ProducesResponseType(typeof(bool), StatusCodes.Status200OK)]
        public async Task<ActionResult<bool>> CanReview(int roomId, CancellationToken cancellationToken)
        {
            var clientId = GetClientId();
            if (clientId == null) return Unauthorized();
            var hasStayed = await _uow.Reservations.HasClientStayedAsync(clientId.Value, roomId, cancellationToken);
            return Ok(hasStayed);
        }

        [Authorize(Roles = "Client")]
        [HttpPost]
        [ProducesResponseType(typeof(ReviewDto), StatusCodes.Status201Created)]
        public async Task<ActionResult<ReviewDto>> Create([FromBody] CreateReviewDto dto, CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var clientId = GetClientId();
            if (clientId == null) return Unauthorized();

            try
            {
                var hasStayed = await _uow.Reservations.HasClientStayedAsync(clientId.Value, dto.RoomId, cancellationToken);
                if (!hasStayed)
                    return Forbid();

                var existing = await _uow.Reviews.GetByClientAndRoomAsync(clientId.Value, dto.RoomId, cancellationToken);
                if (existing != null)
                    return Conflict("You have already reviewed this room");

                var review = new Review
                {
                    ClientId = clientId.Value, RoomId = dto.RoomId,
                    Rating = dto.Rating, Comment = dto.Comment, CreatedAt = DateTime.UtcNow
                };
                review.ReviewId = await _uow.Reviews.CreateAsync(review, cancellationToken);

                return CreatedAtAction(nameof(GetByRoom), new { roomId = dto.RoomId }, new ReviewDto
                {
                    ReviewId = review.ReviewId, ClientId = review.ClientId, RoomId = review.RoomId,
                    Rating = review.Rating, Comment = review.Comment, CreatedAt = review.CreatedAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating review");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("latest")]
        public async Task<ActionResult<IEnumerable<ReviewDto>>> GetLatest([FromQuery] int count = 6, CancellationToken cancellationToken = default)
        {
            try
            {
                var reviews = await _uow.Reviews.GetAllAsync(cancellationToken);
                return Ok(reviews.Take(count).Select(r => new ReviewDto
                {
                    ReviewId = r.ReviewId, ClientId = r.ClientId, RoomId = r.RoomId,
                    Rating = r.Rating, Comment = r.Comment, CreatedAt = r.CreatedAt,
                    ClientName = r.ClientName, AvatarUrl = r.AvatarUrl, RoomNumber = r.RoomNumber
                }));
            }
            catch (Exception ex) { _logger.LogError(ex, "Error getting latest reviews"); return StatusCode(500, "Internal server error"); }
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("all")]
        public async Task<ActionResult<IEnumerable<ReviewDto>>> GetAll(CancellationToken cancellationToken)
        {
            try
            {
                var reviews = await _uow.Reviews.GetAllAsync(cancellationToken);
                return Ok(reviews.Select(r => new ReviewDto
                {
                    ReviewId = r.ReviewId, ClientId = r.ClientId, RoomId = r.RoomId,
                    Rating = r.Rating, Comment = r.Comment, CreatedAt = r.CreatedAt,
                    ClientName = r.ClientName, AvatarUrl = r.AvatarUrl, RoomNumber = r.RoomNumber
                }));
            }
            catch (Exception ex) { _logger.LogError(ex, "Error getting all reviews"); return StatusCode(500, "Internal server error"); }
        }

        [Authorize]
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateReviewDto dto, CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                if (User.IsInRole("Admin"))
                {
                    var updated = await _uow.Reviews.AdminUpdateAsync(id, dto.Rating, dto.Comment, cancellationToken);
                    return updated ? NoContent() : NotFound();
                }

                var clientId = GetClientId();
                if (clientId == null) return Unauthorized();
                var review = new Review { ReviewId = id, ClientId = clientId.Value, Rating = dto.Rating, Comment = dto.Comment };
                var updatedClient = await _uow.Reviews.UpdateAsync(review, cancellationToken);
                return updatedClient ? NoContent() : NotFound();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating review {Id}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        [Authorize]
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
        {
            try
            {
                var deleted = await _uow.Reviews.DeleteAsync(id, cancellationToken);
                return deleted ? NoContent() : NotFound();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting review {Id}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        private int? GetClientId()
        {
            var val = User.FindFirstValue("clientId");
            return int.TryParse(val, out var id) && id > 0 ? id : null;
        }
    }
}
