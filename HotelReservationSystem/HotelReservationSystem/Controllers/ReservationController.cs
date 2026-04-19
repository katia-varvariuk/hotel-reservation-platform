using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HotelReservation.Bll.DTOs;
using HotelReservation.Bll.Services;
using HotelReservation.Domain.Entities;
using HotelReservation.Domain.Exceptions;

namespace HotelReservation.Api.Controllers
{
    [ApiController]
    [Route("api/reservations")]
    [Produces("application/json")]
    public class ReservationController : ControllerBase
    {
        private readonly IReservationService _reservationService;
        private readonly ILogger<ReservationController> _logger;

        public ReservationController(IReservationService reservationService, ILogger<ReservationController> logger)
        {
            _reservationService = reservationService;
            _logger = logger;
        }

        [Authorize(Roles = "Admin")]
        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<ReservationDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<ReservationDto>>> GetAllReservations(CancellationToken cancellationToken)
        {
            try
            {
                var reservations = await _reservationService.GetAllAsync(cancellationToken);
                return Ok(reservations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all reservations");
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
            }
        }

        [Authorize(Roles = "Admin,Client")]
        [HttpGet("{id:int}")]
        [ProducesResponseType(typeof(ReservationDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ReservationDto>> GetReservation(int id, CancellationToken cancellationToken)
        {
            try
            {
                var reservation = await _reservationService.GetByIdAsync(id, cancellationToken);

                if (reservation == null)
                {
                    return NotFound($"Reservation with ID {id} not found");
                }

                return Ok(reservation);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting reservation with ID {ReservationId}", id);
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
            }
        }

        [Authorize(Roles = "Admin,Client")]
        [HttpGet("{id:int}/details")]
        [ProducesResponseType(typeof(ReservationDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ReservationDto>> GetReservationWithDetails(int id, CancellationToken cancellationToken)
        {
            try
            {
                var reservation = await _reservationService.GetWithDetailsAsync(id, cancellationToken);

                if (reservation == null)
                {
                    return NotFound($"Reservation with ID {id} not found");
                }

                return Ok(reservation);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting reservation details with ID {ReservationId}", id);
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
            }
        }

        [Authorize(Roles = "Admin,Client")]
        [HttpPost]
        [ProducesResponseType(typeof(ReservationDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<ActionResult<ReservationDto>> CreateReservation([FromBody] CreateReservationDto createReservationDto, CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var reservation = await _reservationService.CreateAsync(createReservationDto, cancellationToken);
                return CreatedAtAction(nameof(GetReservation), new { id = reservation.ReservationId }, reservation);
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
                _logger.LogError(ex, "Error creating reservation");
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id:int}/status")]
        [ProducesResponseType(typeof(ReservationDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<ActionResult<ReservationDto>> UpdateReservationStatus(int id, [FromBody] UpdateReservationStatusDto updateStatusDto, CancellationToken cancellationToken)
        {
            if (id != updateStatusDto.ReservationId)
            {
                return BadRequest("Reservation ID in URL doesn't match the ID in request body");
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var reservation = await _reservationService.UpdateStatusAsync(updateStatusDto, cancellationToken);
                return Ok(reservation);
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
                _logger.LogError(ex, "Error updating reservation status for ID {ReservationId}", id);
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> DeleteReservation(int id, CancellationToken cancellationToken)
        {
            try
            {
                var isDeleted = await _reservationService.DeleteAsync(id, cancellationToken);

                if (isDeleted)
                {
                    return NoContent();
                }

                return NotFound($"Reservation with ID {id} not found");
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
                _logger.LogError(ex, "Error deleting reservation with ID {ReservationId}", id);
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
            }
        }

        [Authorize(Roles = "Admin,Client")]
        [HttpGet("by-client/{clientId:int}")]
        [ProducesResponseType(typeof(IEnumerable<ReservationDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<ReservationDto>>> GetReservationsByClient(int clientId, CancellationToken cancellationToken)
        {
            try
            {
                var reservations = await _reservationService.GetByClientIdAsync(clientId, cancellationToken);
                return Ok(reservations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting reservations for client ID {ClientId}", clientId);
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("by-date-range")]
        [ProducesResponseType(typeof(IEnumerable<ReservationDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<IEnumerable<ReservationDto>>> GetReservationsByDateRange(
            [FromQuery] DateTime from,
            [FromQuery] DateTime to,
            CancellationToken cancellationToken)
        {
            try
            {
                var reservations = await _reservationService.GetByDateRangeAsync(from, to, cancellationToken);
                return Ok(reservations);
            }
            catch (ValidationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting reservations for date range: {From} - {To}", from, to);
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("{id:int}/confirm")]
        [ProducesResponseType(typeof(ReservationDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<ActionResult<ReservationDto>> Confirm(int id, CancellationToken cancellationToken)
        {
            try
            {
                var reservation = await _reservationService.ConfirmAsync(id, cancellationToken);
                return Ok(reservation);
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
                _logger.LogError(ex, "Error confirming reservation with ID {ReservationId}", id);
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("{id:int}/checkin")]
        [ProducesResponseType(typeof(ReservationDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<ActionResult<ReservationDto>> CheckIn(int id, CancellationToken cancellationToken)
        {
            try
            {
                var reservation = await _reservationService.CheckInAsync(id, cancellationToken);
                return Ok(reservation);
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
                _logger.LogError(ex, "Error checking in reservation with ID {ReservationId}", id);
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("{id:int}/checkout")]
        [ProducesResponseType(typeof(ReservationDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<ActionResult<ReservationDto>> CheckOut(int id, CancellationToken cancellationToken)
        {
            try
            {
                var reservation = await _reservationService.CheckOutAsync(id, cancellationToken);
                return Ok(reservation);
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
                _logger.LogError(ex, "Error checking out reservation with ID {ReservationId}", id);
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
            }
        }

        [Authorize(Roles = "Admin,Client")]
        [HttpPost("{id:int}/cancel")]
        [ProducesResponseType(typeof(ReservationDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<ActionResult<ReservationDto>> Cancel(int id, CancellationToken cancellationToken)
        {
            try
            {
                var reservation = await _reservationService.CancelAsync(id, cancellationToken);
                return Ok(reservation);
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
                _logger.LogError(ex, "Error cancelling reservation with ID {ReservationId}", id);
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
            }
        }
    }
}