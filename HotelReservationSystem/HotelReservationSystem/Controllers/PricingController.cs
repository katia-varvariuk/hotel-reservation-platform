using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HotelReservation.Bll.DTOs;
using HotelReservation.Bll.Services;
using HotelReservation.Dal.Interfaces;
using HotelReservation.Domain.Exceptions;

namespace HotelReservation.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class PricingController : ControllerBase
    {
        private readonly IPricingService _pricingService;
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<PricingController> _logger;

        public PricingController(IPricingService pricingService, IUnitOfWork unitOfWork, ILogger<PricingController> logger)
        {
            _pricingService = pricingService;
            _unitOfWork = unitOfWork;
            _logger = logger;
        }

        // Public: guests can calculate price before booking
        [HttpGet("calculate")]
        [ProducesResponseType(typeof(PriceSummaryDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<PriceSummaryDto>> Calculate(
            [FromQuery] int roomId,
            [FromQuery] DateTime checkIn,
            [FromQuery] DateTime checkOut,
            CancellationToken cancellationToken)
        {
            if (checkIn >= checkOut)
                return BadRequest("Check-out must be after check-in");

            try
            {
                var summary = await _pricingService.GetPriceSummaryAsync(roomId, checkIn, checkOut, cancellationToken);
                return Ok(summary);
            }
            catch (NotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calculating price for room {RoomId}", roomId);
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
            }
        }

        // Admin only: view price change history for a room
        [Authorize(Roles = "Admin")]
        [HttpGet("history/{roomId:int}")]
        [ProducesResponseType(typeof(IEnumerable<PriceHistoryDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<PriceHistoryDto>>> GetHistory(int roomId, CancellationToken cancellationToken)
        {
            try
            {
                var history = await _unitOfWork.PriceHistories.GetByRoomIdAsync(roomId, cancellationToken);
                var dtos = history.Select(h => new PriceHistoryDto
                {
                    PriceHistoryId = h.PriceHistoryId,
                    RoomId = h.RoomId,
                    OldPrice = h.OldPrice,
                    NewPrice = h.NewPrice,
                    Reason = h.Reason,
                    ChangedAt = h.ChangedAt
                });
                return Ok(dtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting price history for room {RoomId}", roomId);
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
            }
        }
    }
}
