using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HotelReservation.Bll.DTOs;
using HotelReservation.Bll.Services;
using HotelReservation.Domain.Exceptions;
using Microsoft.AspNetCore.Hosting;

namespace HotelReservation.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly ILogger<AuthController> _logger;
        private readonly IWebHostEnvironment _env;

        public AuthController(IAuthService authService, ILogger<AuthController> logger, IWebHostEnvironment env)
        {
            _authService = authService;
            _logger = logger;
            _env = env;
        }

        [HttpPost("register")]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterDto registerDto, CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var response = await _authService.RegisterAsync(registerDto, cancellationToken);
                return CreatedAtAction(nameof(Register), response);
            }
            catch (BusinessConflictException ex)
            {
                return Conflict(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during registration for email: {Email}", registerDto.Email);
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
            }
        }

        [Authorize]
        [HttpGet("me")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public IActionResult Me()
        {
            // ASP.NET Core maps JWT "sub" → NameIdentifier, "email" → Email
            var userId   = User.FindFirstValue(ClaimTypes.NameIdentifier)
                        ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            var email    = User.FindFirstValue(ClaimTypes.Email)
                        ?? User.FindFirstValue(JwtRegisteredClaimNames.Email);
            var role     = User.FindFirstValue(ClaimTypes.Role);
            var clientId = User.FindFirstValue("clientId");

            return Ok(new
            {
                UserId   = int.TryParse(userId,   out var uid) ? uid : 0,
                Email    = email,
                Role     = role,
                ClientId = int.TryParse(clientId, out var cid) && cid > 0 ? cid : (int?)null
            });
        }

        [Authorize]
        [HttpPost("change-password")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto, CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier)
                         ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            if (!int.TryParse(userIdStr, out var userId))
                return Unauthorized();

            try
            {
                await _authService.ChangePasswordAsync(userId, dto, cancellationToken);
                return NoContent();
            }
            catch (ValidationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (NotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error changing password for user {UserId}", userId);
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
            }
        }

        [Authorize]
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile(CancellationToken cancellationToken)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            if (!int.TryParse(userIdStr, out var userId)) return Unauthorized();
            var profile = await _authService.GetProfileAsync(userId, cancellationToken);
            if (profile == null) return NotFound();
            return Ok(profile);
        }

        [Authorize]
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateUserProfileDto dto, CancellationToken cancellationToken)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            if (!int.TryParse(userIdStr, out var userId)) return Unauthorized();
            try
            {
                await _authService.UpdateProfileAsync(userId, dto, cancellationToken);
                return NoContent();
            }
            catch (NotFoundException ex) { return NotFound(ex.Message); }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating profile for user {UserId}", userId);
                return StatusCode(500, "Internal server error");
            }
        }

        [Authorize]
        [HttpPost("avatar")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadAvatar(IFormFile avatar, CancellationToken cancellationToken)
        {
            if (avatar == null || avatar.Length == 0) return BadRequest("No file provided");
            var allowed = new[] { "image/jpeg", "image/png", "image/gif", "image/webp" };
            if (!allowed.Contains(avatar.ContentType.ToLower())) return BadRequest("Only image files are allowed");
            if (avatar.Length > 5 * 1024 * 1024) return BadRequest("File size must be less than 5 MB");

            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            if (!int.TryParse(userIdStr, out var userId)) return Unauthorized();

            var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var uploadsDir = Path.Combine(webRoot, "uploads", "avatars");
            Directory.CreateDirectory(uploadsDir);
            var ext = Path.GetExtension(avatar.FileName).ToLower();
            if (string.IsNullOrEmpty(ext)) ext = ".jpg";
            var fileName = $"user_{userId}_{Guid.NewGuid():N}{ext}";
            var filePath = Path.Combine(uploadsDir, fileName);
            await using (var stream = new FileStream(filePath, FileMode.Create))
                await avatar.CopyToAsync(stream, cancellationToken);

            var avatarUrl = $"{Request.Scheme}://{Request.Host}/uploads/avatars/{fileName}";
            var existing = await _authService.GetProfileAsync(userId, cancellationToken);
            await _authService.UpdateProfileAsync(userId, new UpdateUserProfileDto
            {
                FullName = existing?.FullName ?? string.Empty,
                Phone = existing?.Phone,
                AvatarUrl = avatarUrl
            }, cancellationToken);
            return Ok(new { avatarUrl });
        }

        [HttpPost("login")]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto loginDto, CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var response = await _authService.LoginAsync(loginDto, cancellationToken);
                return Ok(response);
            }
            catch (ValidationException ex)
            {
                return Unauthorized(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during login for email: {Email}", loginDto.Email);
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal server error");
            }
        }
    }
}
