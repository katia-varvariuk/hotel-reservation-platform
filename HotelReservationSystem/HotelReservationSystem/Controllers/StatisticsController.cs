using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HotelReservation.Dal.Interfaces;
using HotelReservation.Domain.Entities;

namespace HotelReservation.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    [Authorize(Roles = "Admin")]
    public class StatisticsController : ControllerBase
    {
        private readonly IStatisticsRepository _statistics;
        private readonly ILogger<StatisticsController> _logger;

        public StatisticsController(IStatisticsRepository statistics, ILogger<StatisticsController> logger)
        {
            _statistics = statistics;
            _logger = logger;
        }

        [HttpGet]
        [ProducesResponseType(typeof(StatisticsData), StatusCodes.Status200OK)]
        public async Task<ActionResult<StatisticsData>> Get(CancellationToken cancellationToken)
        {
            try
            {
                var stats = await _statistics.GetAsync(cancellationToken);
                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting statistics");
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
            }
        }
    }
}
