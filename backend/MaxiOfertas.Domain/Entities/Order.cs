namespace MaxiOfertas.Domain.Entities;

public enum OrderStatus
{
    Pending,
    Paid,
    Cancelled
}

public class Order
{
    public Guid Id { get; set; }
    public required Guid UserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    public decimal Total { get; set; }
    public List<OrderItem> Items { get; set; } = [];
}

public class OrderItem
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public Order? Order { get; set; }
    public Guid ProductId { get; set; }
    public required string ProductName { get; set; }
    public required string Mode { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
}
