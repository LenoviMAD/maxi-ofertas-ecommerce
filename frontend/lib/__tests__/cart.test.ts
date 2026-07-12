import { describe, expect, it } from "vitest";
import { addItem, emptyCart, removeItem, updateItemQuantity } from "../cart";
import type { StaticProduct } from "../types";

function producto(overrides: Partial<StaticProduct> = {}): StaticProduct {
  return {
    id: "1",
    name: "MANTECA S Y S X 200 GR",
    category: "Lácteos y Fiambres",
    discountPercent: 0,
    unitPrice: 2500,
    unitPriceBeforeDiscount: null,
    bultoPrice: 72000,
    bultoQty: 30,
    freeShipping: true,
    ean: null,
    stockBySucursal: { claypole: 10 },
    ...overrides,
  };
}

describe("emptyCart", () => {
  it("arranca vacío con total 0", () => {
    expect(emptyCart()).toEqual({ id: "local", items: [], total: 0 });
  });
});

describe("addItem", () => {
  it("agrega un ítem por unidad", () => {
    const cart = addItem(emptyCart(), producto(), "unidad", 1);
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]).toMatchObject({
      id: "1:unidad", productId: "1", productName: "MANTECA S Y S X 200 GR",
      mode: "unidad", quantity: 1, unitPrice: 2500, subtotal: 2500,
    });
    expect(cart.total).toBe(2500);
  });

  it("suma cantidades al repetir producto y modo", () => {
    let cart = addItem(emptyCart(), producto(), "unidad", 1);
    cart = addItem(cart, producto(), "unidad", 2);
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].quantity).toBe(3);
    expect(cart.total).toBe(7500);
  });

  it("modo bulto: cantidad en unidades, precio unitario = bultoPrice/bultoQty", () => {
    const cart = addItem(emptyCart(), producto(), "bulto", 30);
    expect(cart.items[0].unitPrice).toBe(2400);
    expect(cart.items[0].subtotal).toBe(72000);
    expect(cart.total).toBe(72000);
  });

  it("unidad y bulto del mismo producto son ítems separados", () => {
    let cart = addItem(emptyCart(), producto(), "unidad", 1);
    cart = addItem(cart, producto(), "bulto", 30);
    expect(cart.items.map((i) => i.id)).toEqual(["1:unidad", "1:bulto"]);
    expect(cart.total).toBe(74500);
  });

  it("no muta el carrito original", () => {
    const original = emptyCart();
    addItem(original, producto(), "unidad", 1);
    expect(original.items).toHaveLength(0);
  });
});

describe("updateItemQuantity", () => {
  it("actualiza cantidad y recalcula totales", () => {
    let cart = addItem(emptyCart(), producto(), "unidad", 1);
    cart = updateItemQuantity(cart, "1:unidad", 4);
    expect(cart.items[0].quantity).toBe(4);
    expect(cart.items[0].subtotal).toBe(10000);
    expect(cart.total).toBe(10000);
  });

  it("cantidad 0 elimina el ítem", () => {
    let cart = addItem(emptyCart(), producto(), "unidad", 2);
    cart = updateItemQuantity(cart, "1:unidad", 0);
    expect(cart.items).toHaveLength(0);
    expect(cart.total).toBe(0);
  });
});

describe("removeItem", () => {
  it("elimina el ítem y recalcula el total", () => {
    let cart = addItem(emptyCart(), producto(), "unidad", 1);
    cart = addItem(cart, producto({ id: "2", name: "OTRO", unitPrice: 1000 }), "unidad", 1);
    cart = removeItem(cart, "1:unidad");
    expect(cart.items.map((i) => i.id)).toEqual(["2:unidad"]);
    expect(cart.total).toBe(1000);
  });
});
