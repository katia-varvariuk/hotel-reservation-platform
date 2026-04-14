using HotelReservation.Bll.DTOs;

namespace HotelReservation.Bll.Services
{
    public interface IAuthService
    {
        Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto, CancellationToken cancellationToken = default);
        Task<AuthResponseDto> LoginAsync(LoginDto loginDto, CancellationToken cancellationToken = default);
        Task ChangePasswordAsync(int userId, ChangePasswordDto dto, CancellationToken cancellationToken = default);
        Task<UserProfileDto?> GetProfileAsync(int userId, CancellationToken cancellationToken = default);
        Task UpdateProfileAsync(int userId, UpdateUserProfileDto dto, CancellationToken cancellationToken = default);
    }
}
