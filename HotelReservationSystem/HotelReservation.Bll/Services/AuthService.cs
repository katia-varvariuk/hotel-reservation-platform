using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BCrypt.Net;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using HotelReservation.Bll.DTOs;
using HotelReservation.Dal.Interfaces;
using HotelReservation.Domain.Entities;
using HotelReservation.Domain.Exceptions;

namespace HotelReservation.Bll.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthService> _logger;

        public AuthService(IUnitOfWork unitOfWork, IConfiguration configuration, ILogger<AuthService> logger)
        {
            _unitOfWork = unitOfWork;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Registering user with email: {Email}", dto.Email);

            var existing = await _unitOfWork.Users.GetByEmailAsync(dto.Email, cancellationToken);
            if (existing != null)
                throw new BusinessConflictException("User with this email already exists");

            var adminSecret = _configuration["JwtSettings:AdminSecret"];
            var role = (!string.IsNullOrEmpty(dto.AdminSecret) && dto.AdminSecret == adminSecret)
                ? UserRole.Admin
                : UserRole.Client;

            int? clientId = null;

            if (role == UserRole.Client)
            {
                var client = new Client
                {
                    FullName = dto.FullName,
                    Phone = dto.Phone,
                    Email = dto.Email,
                    PassportData = dto.PassportData,
                    CreatedAt = DateTime.UtcNow
                };
                clientId = await _unitOfWork.Clients.CreateAsync(client, cancellationToken);
            }

            var user = new User
            {
                Email = dto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Role = role,
                ClientId = clientId,
                CreatedAt = DateTime.UtcNow
            };

            user.UserId = await _unitOfWork.Users.CreateAsync(user, cancellationToken);

            _logger.LogInformation("User {Email} registered with role {Role}", dto.Email, role);

            return BuildResponse(user);
        }

        public async Task<AuthResponseDto> LoginAsync(LoginDto dto, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Login attempt for email: {Email}", dto.Email);

            var user = await _unitOfWork.Users.GetByEmailAsync(dto.Email, cancellationToken);
            if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
                throw new ValidationException("Invalid email or password");
            if (user.IsBlocked)
                throw new ValidationException("Your account has been blocked. Please contact support.");

            _logger.LogInformation("User {Email} logged in successfully", dto.Email);

            return BuildResponse(user);
        }

        public async Task ChangePasswordAsync(int userId, ChangePasswordDto dto, CancellationToken cancellationToken = default)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(userId, cancellationToken)
                ?? throw new NotFoundException("User not found");

            if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash))
                throw new ValidationException("Current password is incorrect");

            var newHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            await _unitOfWork.Users.UpdatePasswordAsync(userId, newHash, cancellationToken);
        }

        private AuthResponseDto BuildResponse(User user)
        {
            var token = GenerateToken(user);
            var expiryMinutes = int.Parse(_configuration["JwtSettings:ExpiryMinutes"] ?? "60");

            return new AuthResponseDto
            {
                Token = token,
                Email = user.Email,
                Role = user.Role.ToString(),
                UserId = user.UserId,
                ClientId = user.ClientId,
                ExpiresAt = DateTime.UtcNow.AddMinutes(expiryMinutes)
            };
        }

        private string GenerateToken(User user)
        {
            var secretKey = _configuration["JwtSettings:SecretKey"]
                ?? throw new InvalidOperationException("JWT SecretKey is not configured");
            var issuer = _configuration["JwtSettings:Issuer"] ?? "HotelReservationSystem";
            var audience = _configuration["JwtSettings:Audience"] ?? "HotelReservationSystem";
            var expiryMinutes = int.Parse(_configuration["JwtSettings:ExpiryMinutes"] ?? "60");

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.UserId.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role.ToString()),
                new Claim("clientId", user.ClientId?.ToString() ?? string.Empty),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public async Task<UserProfileDto?> GetProfileAsync(int userId, CancellationToken cancellationToken = default)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(userId, cancellationToken);
            if (user == null) return null;
            return new UserProfileDto
            {
                UserId = user.UserId,
                Email = user.Email,
                Role = user.Role.ToString(),
                FullName = user.FullName,
                Phone = user.Phone,
                AvatarUrl = user.AvatarUrl,
            };
        }

        public async Task UpdateProfileAsync(int userId, UpdateUserProfileDto dto, CancellationToken cancellationToken = default)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(userId, cancellationToken);
            if (user == null) throw new NotFoundException($"User {userId} not found");
            await _unitOfWork.Users.UpdateProfileAsync(userId, dto.FullName, dto.Phone, dto.AvatarUrl, cancellationToken);
        }
    }
}
