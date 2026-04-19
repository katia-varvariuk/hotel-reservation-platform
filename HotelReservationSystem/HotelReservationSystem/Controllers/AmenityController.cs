using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HotelReservation.Bll.DTOs;
using HotelReservation.Bll.Services;
using HotelReservation.Domain.Exceptions;

namespace HotelReservation.Api.Controllers
{
    [ApiController]
    [Route("api/amenities")]
    [Produces("application/json")]
    public class AmenityController : ControllerBase
    {
        private readonly IAmenityService _service;
        private readonly ILogger<AmenityController> _logger;

        public AmenityController(IAmenityService service, ILogger<AmenityController> logger)
        {
            _service = service;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<AmenityDto>>> GetAll(CancellationToken ct)
        {
            try { return Ok(await _service.GetAllAsync(ct)); }
            catch (Exception ex) { _logger.LogError(ex, "Error getting amenities"); return StatusCode(500, "Internal server error"); }
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<AmenityDto>> GetById(int id, CancellationToken ct)
        {
            try
            {
                var a = await _service.GetByIdAsync(id, ct);
                return a is null ? NotFound() : Ok(a);
            }
            catch (Exception ex) { _logger.LogError(ex, "Error getting amenity {Id}", id); return StatusCode(500, "Internal server error"); }
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<ActionResult<AmenityDto>> Create([FromBody] CreateAmenityDto dto, CancellationToken ct)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            try
            {
                var a = await _service.CreateAsync(dto, ct);
                return CreatedAtAction(nameof(GetById), new { id = a.AmenityId }, a);
            }
            catch (Exception ex) { _logger.LogError(ex, "Error creating amenity"); return StatusCode(500, "Internal server error"); }
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id:int}")]
        public async Task<ActionResult<AmenityDto>> Update(int id, [FromBody] CreateAmenityDto dto, CancellationToken ct)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            try { return Ok(await _service.UpdateAsync(id, dto, ct)); }
            catch (NotFoundException ex) { return NotFound(ex.Message); }
            catch (Exception ex) { _logger.LogError(ex, "Error updating amenity {Id}", id); return StatusCode(500, "Internal server error"); }
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id, CancellationToken ct)
        {
            try { await _service.DeleteAsync(id, ct); return NoContent(); }
            catch (NotFoundException ex) { return NotFound(ex.Message); }
            catch (Exception ex) { _logger.LogError(ex, "Error deleting amenity {Id}", id); return StatusCode(500, "Internal server error"); }
        }

        [HttpGet("room/{roomId:int}")]
        public async Task<ActionResult<IEnumerable<AmenityDto>>> GetByRoom(int roomId, CancellationToken ct)
        {
            try { return Ok(await _service.GetByRoomIdAsync(roomId, ct)); }
            catch (Exception ex) { _logger.LogError(ex, "Error getting amenities for room {RoomId}", roomId); return StatusCode(500, "Internal server error"); }
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("room/{roomId:int}")]
        public async Task<IActionResult> SetRoomAmenities(int roomId, [FromBody] SetRoomAmenitiesDto dto, CancellationToken ct)
        {
            try { await _service.SetRoomAmenitiesAsync(roomId, dto, ct); return NoContent(); }
            catch (Exception ex) { _logger.LogError(ex, "Error setting amenities for room {RoomId}", roomId); return StatusCode(500, "Internal server error"); }
        }
    }
}
