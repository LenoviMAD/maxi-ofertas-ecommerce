using MaxiOfertas.Domain.Entities;
using MaxiOfertas.Domain.Repositories;

namespace MaxiOfertas.Infrastructure.Repositories;

/// <summary>
/// Catálogo temporal hasta que se conecte una implementación que lea del SQL Server del ERP (solo lectura).
/// </summary>
public class MockProductRepository : IProductRepository
{
    private static readonly List<Product> Products =
    [
        new() { Id = Guid.Parse("00000000-0000-0000-0000-000000000001"), Name = "Yerba Taragüí 1kg", Category = "Almacén", DiscountPercent = 12, UnitPrice = 2890, UnitPriceBeforeDiscount = 3260, BultoPrice = 16500, BultoQty = 6 },
        new() { Id = Guid.Parse("00000000-0000-0000-0000-000000000002"), Name = "Aceite Marolio 900ml", Category = "Almacén", DiscountPercent = 9, UnitPrice = 1750, UnitPriceBeforeDiscount = 1920, BultoPrice = 10000, BultoQty = 6 },
        new() { Id = Guid.Parse("00000000-0000-0000-0000-000000000003"), Name = "Gaseosa Manaos Cola 2.25L", Category = "Bebidas", DiscountPercent = 0, UnitPrice = 990, BultoPrice = 5600, BultoQty = 6, FreeShipping = true },
        new() { Id = Guid.Parse("00000000-0000-0000-0000-000000000004"), Name = "Detergente Skip 500ml", Category = "Limpieza", DiscountPercent = 20, UnitPrice = 1450, UnitPriceBeforeDiscount = 1810, BultoPrice = 8200, BultoQty = 6 },
        new() { Id = Guid.Parse("00000000-0000-0000-0000-000000000005"), Name = "Papel higiénico Higienol x4", Category = "Higiene", DiscountPercent = 35, UnitPrice = 1890, UnitPriceBeforeDiscount = 2910, BultoPrice = 10800, BultoQty = 6 },
        new() { Id = Guid.Parse("00000000-0000-0000-0000-000000000006"), Name = "Fideos Lucchetti 500g", Category = "Almacén", DiscountPercent = 30, UnitPrice = 850, UnitPriceBeforeDiscount = 1215, BultoPrice = 4800, BultoQty = 6 },
        new() { Id = Guid.Parse("00000000-0000-0000-0000-000000000007"), Name = "Cerveza Quilmes 1L", Category = "Bebidas", DiscountPercent = 0, UnitPrice = 1650, BultoPrice = 9400, BultoQty = 6, FreeShipping = true },
        new() { Id = Guid.Parse("00000000-0000-0000-0000-000000000008"), Name = "Leche La Serenísima 1L", Category = "Lácteos", DiscountPercent = 4, UnitPrice = 1290, UnitPriceBeforeDiscount = 1345, BultoPrice = 7400, BultoQty = 6 },
        new() { Id = Guid.Parse("00000000-0000-0000-0000-000000000009"), Name = "Papas Lays clásicas 220g", Category = "Almacén", DiscountPercent = 25, UnitPrice = 2890, UnitPriceBeforeDiscount = 3850, BultoPrice = 16000, BultoQty = 6, LastUnits = true },
        new() { Id = Guid.Parse("00000000-0000-0000-0000-00000000000a"), Name = "Pizza La Salteña x2", Category = "Congelados", DiscountPercent = 20, UnitPrice = 2400, UnitPriceBeforeDiscount = 3000, BultoPrice = 13600, BultoQty = 6 },
        new() { Id = Guid.Parse("00000000-0000-0000-0000-00000000000b"), Name = "Manaos Cola 500ml", Category = "Bebidas", DiscountPercent = 17, UnitPrice = 520, BultoPrice = 2900, BultoQty = 6 },
        new() { Id = Guid.Parse("00000000-0000-0000-0000-00000000000c"), Name = "Agua Villavicencio 2L", Category = "Bebidas", DiscountPercent = 0, UnitPrice = 880, BultoPrice = 4900, BultoQty = 6 },
        new() { Id = Guid.Parse("00000000-0000-0000-0000-00000000000d"), Name = "Soda Sifón 1.5L", Category = "Bebidas", DiscountPercent = 0, UnitPrice = 680, BultoPrice = 3800, BultoQty = 6 },
    ];

    public Task<IReadOnlyList<Product>> GetAllAsync(CancellationToken ct = default)
        => Task.FromResult<IReadOnlyList<Product>>(Products);

    public Task<Product?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => Task.FromResult(Products.FirstOrDefault(p => p.Id == id));
}
