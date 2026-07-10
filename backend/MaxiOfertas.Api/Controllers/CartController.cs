using System.Security.Claims;
using MaxiOfertas.Api.Dtos;
using MaxiOfertas.Domain.Entities;
using MaxiOfertas.Domain.Repositories;
using MaxiOfertas.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MaxiOfertas.Api.Controllers;

[ApiController]
[Route("api/cart")]
[Authorize]
public class CartController(MaxiOfertasDbContext db, IProductRepository products) : ControllerBase
{
    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult<CartResponse>> GetCart(CancellationToken ct)
    {
        var cart = await GetOrCreateCartAsync(ct);
        return Ok(await ToResponseAsync(cart, ct));
    }

    [HttpPost("items")]
    public async Task<ActionResult<CartResponse>> AddItem(AddCartItemRequest request, CancellationToken ct)
    {
        var product = await products.GetByIdAsync(request.ProductId, ct);
        if (product is null) return NotFound("Producto no encontrado.");

        var cart = await GetOrCreateCartAsync(ct);
        var isBulto = request.Mode == "bulto";
        var unitPrice = isBulto ? product.BultoPrice : product.UnitPrice;

        var existing = cart.Items.FirstOrDefault(i => i.ProductId == request.ProductId && i.Mode == request.Mode);
        if (existing is not null)
        {
            existing.Quantity += request.Quantity;
        }
        else
        {
            cart.Items.Add(new CartItem
            {
                Id = Guid.NewGuid(),
                CartId = cart.Id,
                ProductId = product.Id,
                Mode = request.Mode,
                Quantity = request.Quantity,
                UnitPriceSnapshot = unitPrice,
            });
        }

        await db.SaveChangesAsync(ct);
        return Ok(await ToResponseAsync(cart, ct));
    }

    [HttpPut("items/{itemId:guid}")]
    public async Task<ActionResult<CartResponse>> UpdateItem(Guid itemId, UpdateCartItemRequest request, CancellationToken ct)
    {
        var cart = await GetOrCreateCartAsync(ct);
        var item = cart.Items.FirstOrDefault(i => i.Id == itemId);
        if (item is null) return NotFound();

        if (request.Quantity <= 0)
        {
            cart.Items.Remove(item);
            db.CartItems.Remove(item);
        }
        else
        {
            item.Quantity = request.Quantity;
        }

        await db.SaveChangesAsync(ct);
        return Ok(await ToResponseAsync(cart, ct));
    }

    [HttpDelete("items/{itemId:guid}")]
    public async Task<ActionResult<CartResponse>> RemoveItem(Guid itemId, CancellationToken ct)
    {
        var cart = await GetOrCreateCartAsync(ct);
        var item = cart.Items.FirstOrDefault(i => i.Id == itemId);
        if (item is not null)
        {
            cart.Items.Remove(item);
            db.CartItems.Remove(item);
            await db.SaveChangesAsync(ct);
        }

        return Ok(await ToResponseAsync(cart, ct));
    }

    private async Task<Cart> GetOrCreateCartAsync(CancellationToken ct)
    {
        var cart = await db.Carts.Include(c => c.Items).FirstOrDefaultAsync(c => c.UserId == UserId, ct);
        if (cart is not null) return cart;

        cart = new Cart { Id = Guid.NewGuid(), UserId = UserId };
        db.Carts.Add(cart);
        await db.SaveChangesAsync(ct);
        return cart;
    }

    private async Task<CartResponse> ToResponseAsync(Cart cart, CancellationToken ct)
    {
        var items = new List<CartItemResponse>();
        foreach (var item in cart.Items)
        {
            var product = await products.GetByIdAsync(item.ProductId, ct);
            items.Add(new CartItemResponse(
                item.Id,
                item.ProductId,
                product?.Name ?? "Producto",
                item.Mode,
                item.Quantity,
                item.UnitPriceSnapshot,
                item.UnitPriceSnapshot * item.Quantity));
        }

        return new CartResponse(cart.Id, items, items.Sum(i => i.Subtotal));
    }
}
