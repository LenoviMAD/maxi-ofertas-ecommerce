namespace MaxiOfertas.Domain.Entities;

public class Product
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public required string Category { get; set; }
    public int DiscountPercent { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal? UnitPriceBeforeDiscount { get; set; }
    public decimal BultoPrice { get; set; }
    public int BultoQty { get; set; }
    public bool FreeShipping { get; set; }
    public bool LastUnits { get; set; }
    public string? ImageUrl { get; set; }
}
