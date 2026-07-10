using Microsoft.AspNetCore.Identity;

namespace MaxiOfertas.Infrastructure.Identity;

public class ApplicationUser : IdentityUser<Guid>
{
    public string? DisplayName { get; set; }
    public string? AvatarUrl { get; set; }
}
