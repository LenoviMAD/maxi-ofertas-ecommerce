using MaxiOfertas.Domain.Entities;

namespace MaxiOfertas.Api.Dtos;

public record OrderItemResponse(Guid ProductId, string ProductName, string Mode, int Quantity, decimal UnitPrice, decimal Subtotal);

public record OrderResponse(Guid Id, OrderStatus Status, DateTime CreatedAt, decimal Total, List<OrderItemResponse> Items);
