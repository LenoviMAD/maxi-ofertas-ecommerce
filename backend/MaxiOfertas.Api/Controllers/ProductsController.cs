using MaxiOfertas.Domain.Entities;
using MaxiOfertas.Domain.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace MaxiOfertas.Api.Controllers;

[ApiController]
[Route("api/products")]
public class ProductsController(IProductRepository products) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<Product>>> GetAll(CancellationToken ct)
        => Ok(await products.GetAllAsync(ct));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<Product>> GetById(Guid id, CancellationToken ct)
    {
        var product = await products.GetByIdAsync(id, ct);
        return product is null ? NotFound() : Ok(product);
    }
}
