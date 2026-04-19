using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HotelReservation.Bll.DTOs;
using HotelReservation.Dal.Interfaces;
using HotelReservation.Domain.Entities;
using HotelReservation.Domain.Exceptions;

namespace HotelReservation.Api.Controllers
{
    [ApiController]
    [Route("api/price-rules")]
    [Produces("application/json")]
    [Authorize(Roles = "Admin")]
    public class PriceRuleController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly ILogger<PriceRuleController> _logger;

        public PriceRuleController(IUnitOfWork unitOfWork, IMapper mapper, ILogger<PriceRuleController> logger)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _logger = logger;
        }

        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<PriceRuleDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<PriceRuleDto>>> GetAll(CancellationToken cancellationToken)
        {
            try
            {
                var rules = await _unitOfWork.PriceRules.GetAllAsync(cancellationToken);
                return Ok(_mapper.Map<IEnumerable<PriceRuleDto>>(rules));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting price rules");
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
            }
        }

        [HttpGet("{id:int}")]
        [ProducesResponseType(typeof(PriceRuleDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<PriceRuleDto>> GetById(int id, CancellationToken cancellationToken)
        {
            try
            {
                var rule = await _unitOfWork.PriceRules.GetByIdAsync(id, cancellationToken);
                if (rule == null) return NotFound($"Price rule with ID {id} not found");
                return Ok(_mapper.Map<PriceRuleDto>(rule));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting price rule {Id}", id);
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
            }
        }

        [HttpPost]
        [ProducesResponseType(typeof(PriceRuleDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<PriceRuleDto>> Create([FromBody] CreatePriceRuleDto dto, CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                if (!Enum.TryParse<PriceRuleType>(dto.RuleType, ignoreCase: true, out _))
                    return BadRequest($"Invalid RuleType '{dto.RuleType}'. Valid values: Season, DayOfWeek, Occupancy, Duration");

                var rule = _mapper.Map<PriceRule>(dto);
                rule.PriceRuleId = await _unitOfWork.PriceRules.CreateAsync(rule, cancellationToken);

                _logger.LogInformation("Price rule created: {Name}", rule.Name);
                return CreatedAtAction(nameof(GetById), new { id = rule.PriceRuleId }, _mapper.Map<PriceRuleDto>(rule));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating price rule");
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
            }
        }

        [HttpPut("{id:int}")]
        [ProducesResponseType(typeof(PriceRuleDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<PriceRuleDto>> Update(int id, [FromBody] CreatePriceRuleDto dto, CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                var existing = await _unitOfWork.PriceRules.GetByIdAsync(id, cancellationToken);
                if (existing == null) return NotFound($"Price rule with ID {id} not found");

                if (!Enum.TryParse<PriceRuleType>(dto.RuleType, ignoreCase: true, out _))
                    return BadRequest($"Invalid RuleType '{dto.RuleType}'");

                _mapper.Map(dto, existing);
                existing.PriceRuleId = id;
                await _unitOfWork.PriceRules.UpdateAsync(existing, cancellationToken);

                return Ok(_mapper.Map<PriceRuleDto>(existing));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating price rule {Id}", id);
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
            }
        }

        [HttpDelete("{id:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
        {
            try
            {
                var deleted = await _unitOfWork.PriceRules.DeleteAsync(id, cancellationToken);
                if (!deleted) return NotFound($"Price rule with ID {id} not found");
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting price rule {Id}", id);
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
            }
        }
    }
}
