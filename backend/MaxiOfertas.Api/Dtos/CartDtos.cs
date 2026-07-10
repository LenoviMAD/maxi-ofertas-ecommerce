namespace MaxiOfertas.Api.Dtos;

public record AddCartItemRequest(Guid ProductId, string Mode, int Quantity);

public record UpdateCartItemRequest(int Quantity);

public record CartItemResponse(Guid Id, Guid ProductId, string ProductName, string Mode, int Quantity, decimal UnitPrice, decimal Subtotal);

public record CartResponse(Guid Id, List<CartItemResponse> Items, decimal Total);
