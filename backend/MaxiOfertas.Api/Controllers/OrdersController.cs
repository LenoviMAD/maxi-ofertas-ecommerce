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
[Route("api/orders")]
[Authorize]
public class OrdersController(MaxiOfertasDbContext db, IProductRepository products) : ControllerBase
{
    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpPost]
    public async Task<ActionResult<OrderResponse>> Checkout(CancellationToken ct)
    {
        var cart = await db.Carts.Include(c => c.Items).FirstOrDefaultAsync(c => c.UserId == UserId, ct);
        if (cart is null || cart.Items.Count == 0)
        {
            return BadRequest("El carrito está vacío.");
        }

        var order = new Order { Id = Guid.NewGuid(), UserId = UserId };
        foreach (var cartItem in cart.Items)
        {
            var product = await products.GetByIdAsync(cartItem.ProductId, ct);
            order.Items.Add(new OrderItem
            {
                Id = Guid.NewGuid(),
                OrderId = order.Id,
                ProductId = cartItem.ProductId,
                ProductName = product?.Name ?? "Producto",
                Mode = cartItem.Mode,
                Quantity = cartItem.Quantity,
                UnitPrice = cartItem.UnitPriceSnapshot,
            });
        }
        order.Total = order.Items.Sum(i => i.UnitPrice * i.Quantity);

        db.Orders.Add(order);
        db.CartItems.RemoveRange(cart.Items);
        cart.Items.Clear();
        await db.SaveChangesAsync(ct);

        return Ok(ToResponse(order));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<OrderResponse>> GetById(Guid id, CancellationToken ct)
    {
        var order = await db.Orders.Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id && o.UserId == UserId, ct);
        return order is null ? NotFound() : Ok(ToResponse(order));
    }

    [HttpGet]
    public async Task<ActionResult<List<OrderResponse>>> GetMine(CancellationToken ct)
    {
        var orders = await db.Orders.Include(o => o.Items)
            .Where(o => o.UserId == UserId)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync(ct);
        return Ok(orders.Select(ToResponse));
    }

    private static OrderResponse ToResponse(Order order) => new(
        order.Id,
        order.Status,
        order.CreatedAt,
        order.Total,
        order.Items.Select(i => new OrderItemResponse(i.ProductId, i.ProductName, i.Mode, i.Quantity, i.UnitPrice, i.UnitPrice * i.Quantity)).ToList());
}
