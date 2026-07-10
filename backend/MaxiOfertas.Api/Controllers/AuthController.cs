using Google.Apis.Auth;
using MaxiOfertas.Api.Dtos;
using MaxiOfertas.Api.Services;
using MaxiOfertas.Infrastructure.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;

namespace MaxiOfertas.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(
    UserManager<ApplicationUser> userManager,
    JwtTokenService jwtTokenService,
    IConfiguration config) : ControllerBase
{
    [HttpPost("google")]
    public async Task<ActionResult<AuthResponse>> LoginWithGoogle(GoogleLoginRequest request)
    {
        GoogleJsonWebSignature.Payload payload;
        try
        {
            payload = await GoogleJsonWebSignature.ValidateAsync(request.IdToken, new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = [config["Google:ClientId"]!]
            });
        }
        catch (InvalidJwtException)
        {
            return Unauthorized("Token de Google inválido.");
        }

        var user = await userManager.FindByEmailAsync(payload.Email);
        if (user is null)
        {
            user = new ApplicationUser
            {
                UserName = payload.Email,
                Email = payload.Email,
                EmailConfirmed = payload.EmailVerified,
                DisplayName = payload.Name,
                AvatarUrl = payload.Picture,
            };

            var createResult = await userManager.CreateAsync(user);
            if (!createResult.Succeeded)
            {
                return BadRequest(createResult.Errors);
            }

            await userManager.AddLoginAsync(user, new Microsoft.AspNetCore.Identity.UserLoginInfo("Google", payload.Subject, "Google"));
        }

        var token = jwtTokenService.CreateToken(user);
        return Ok(new AuthResponse(token, user.Email!, user.DisplayName, user.AvatarUrl));
    }
}
