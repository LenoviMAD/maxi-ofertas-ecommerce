namespace MaxiOfertas.Domain.Entities;

public class Cart
{
    public Guid Id { get; set; }
    public required Guid UserId { get; set; }
    public List<CartItem> Items { get; set; } = [];
}

public class CartItem
{
    public Guid Id { get; set; }
    public Guid CartId { get; set; }
    public Cart? Cart { get; set; }
    public Guid ProductId { get; set; }
    public required string Mode { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPriceSnapshot { get; set; }
}
