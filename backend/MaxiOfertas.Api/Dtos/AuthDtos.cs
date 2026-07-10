namespace MaxiOfertas.Api.Dtos;

public record GoogleLoginRequest(string IdToken);

public record AuthResponse(string Token, string Email, string? DisplayName, string? AvatarUrl);
