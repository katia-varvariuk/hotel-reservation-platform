using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HotelReservation.Bll.DTOs;
using HotelReservation.Dal.Interfaces;
using HotelReservation.Domain.Entities;

namespace HotelReservation.Api.Controllers
{
    [ApiController]
    [Route("api/services")]
    [Produces("application/json")]
    public class HotelServiceController : ControllerBase
    {
        private readonly IHotelServiceRepository _repo;
        private readonly ILogger<HotelServiceController> _logger;

        public HotelServiceController(IHotelServiceRepository repo, ILogger<HotelServiceController> logger)
        {
            _repo = repo;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<HotelServiceDto>>> GetAll(CancellationToken ct)
        {
            try
            {
                var items = await _repo.GetAllAsync(ct);
                return Ok(items.Select(ToDto));
            }
            catch (Exception ex) { _logger.LogError(ex, "Error getting services"); return StatusCode(500, "Internal server error"); }
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<ActionResult<HotelServiceDto>> Create([FromBody] CreateHotelServiceDto dto, CancellationToken ct)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            try
            {
                var entity = ToEntity(dto);
                entity.ServiceId = await _repo.CreateAsync(entity, ct);
                return CreatedAtAction(nameof(GetAll), ToDto(entity));
            }
            catch (Exception ex) { _logger.LogError(ex, "Error creating service"); return StatusCode(500, "Internal server error"); }
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id:int}")]
        public async Task<ActionResult<HotelServiceDto>> Update(int id, [FromBody] CreateHotelServiceDto dto, CancellationToken ct)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            try
            {
                var entity = ToEntity(dto);
                entity.ServiceId = id;
                var updated = await _repo.UpdateAsync(entity, ct);
                if (!updated) return NotFound();
                return Ok(ToDto(entity));
            }
            catch (Exception ex) { _logger.LogError(ex, "Error updating service {Id}", id); return StatusCode(500, "Internal server error"); }
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id, CancellationToken ct)
        {
            try
            {
                var deleted = await _repo.DeleteAsync(id, ct);
                return deleted ? NoContent() : NotFound();
            }
            catch (Exception ex) { _logger.LogError(ex, "Error deleting service {Id}", id); return StatusCode(500, "Internal server error"); }
        }

        private static HotelServiceDto ToDto(HotelService s) => new()
        {
            ServiceId = s.ServiceId, Category = s.Category, Name = s.Name,
            Description = s.Description, Price = s.Price, Unit = s.Unit,
            IncludedIn = s.IncludedIn, SortOrder = s.SortOrder
        };

        private static HotelService ToEntity(CreateHotelServiceDto d) => new()
        {
            Category = d.Category.Trim(), Name = d.Name.Trim(),
            Description = d.Description?.Trim(), Price = d.Price,
            Unit = d.Unit?.Trim(), IncludedIn = d.IncludedIn?.Trim(), SortOrder = d.SortOrder
        };
    }
}
