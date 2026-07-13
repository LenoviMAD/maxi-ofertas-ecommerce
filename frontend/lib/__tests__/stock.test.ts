import { describe, expect, it } from "vitest";
import { addItem, emptyCart } from "../cart";
import { SUCURSALES } from "../data/sucursales";
import {
  findNearestWithFullStock, mejorCobertura, stockDe, validateCart,
} from "../stock";
import type { CartItem, PriceMode, StaticProduct } from "../types";

const CLAYPOLE = { lat: SUCURSALES[0].lat, lng: SUCURSALES[0].lng };

function stocks(parciales: Record<string, number>): Record<string, number> {
  const all: Record<string, number> = {};
  for (const s of SUCURSALES) all[s.id] = 0;
  return { ...all, ...parciales };
}

function producto(
  id: string,
  stockBySucursal: Record<string, number>,
  overrides: Partial<StaticProduct> = {}
): StaticProduct {
  return {
    id,
    name: `PRODUCTO ${id}`,
    category: "Almacén",
    discountPercent: 0,
    unitPrice: 100,
    unitPriceBeforeDiscount: null,
    bultoPrice: 1000,
    bultoQty: 10,
    freeShipping: false,
    ean: null,
    stockBySucursal,
    ...overrides,
  };
}

function itemsDe(...pares: Array<[StaticProduct, PriceMode, number]>): CartItem[] {
  let cart = emptyCart();
  for (const [p, mode, qty] of pares) cart = addItem(cart, p, mode, qty);
  return cart.items;
}

describe("stockDe", () => {
  it("devuelve el stock de la sucursal y 0 si falta la clave", () => {
    const p = producto("1", stocks({ claypole: 7 }));
    expect(stockDe(p, "claypole")).toBe(7);
    expect(stockDe(p, "bernal")).toBe(0);
    expect(stockDe(p, "inexistente")).toBe(0);
  });
});

describe("validateCart", () => {
  it("ok cuando el stock alcanza para todo", () => {
    const p = producto("1", stocks({ claypole: 10 }));
    expect(validateCart(itemsDe([p, "unidad", 5]), "claypole", [p])).toEqual({ ok: true });
  });

  it("suma unidad + bulto del mismo producto contra el stock", () => {
    const p = producto("1", stocks({ claypole: 25 }));
    const items = itemsDe([p, "unidad", 1], [p, "bulto", 10], [p, "bulto", 20]);
    const res = validateCart(items, "claypole", [p]);
    expect(res).toEqual({
      ok: false,
      faltantes: [{ productId: "1", nombre: "PRODUCTO 1", pedido: 31, disponible: 25 }],
    });
  });

  it("producto que ya no existe en el catálogo cuenta como disponible 0", () => {
    const p = producto("999", stocks({ claypole: 10 }));
    const items = itemsDe([p, "unidad", 2]);
    const res = validateCart(items, "claypole", []);
    expect(res).toEqual({
      ok: false,
      faltantes: [{ productId: "999", nombre: "PRODUCTO 999", pedido: 2, disponible: 0 }],
    });
  });

  it("carrito vacío es ok", () => {
    expect(validateCart([], "claypole", [])).toEqual({ ok: true });
  });
});

describe("findNearestWithFullStock", () => {
  it("devuelve la más cercana que cubre todo el pedido", () => {
    // Solo Bernal cubre; Claypole (activa) y el resto no.
    const p = producto("1", stocks({ claypole: 2, bernal: 50 }));
    const items = itemsDe([p, "unidad", 24]);
    const res = findNearestWithFullStock(items, SUCURSALES, CLAYPOLE, [p]);
    expect(res?.id).toBe("bernal");
    expect(res?.distanciaKm).toBeGreaterThan(0);
  });

  it("null cuando ninguna sucursal cubre el pedido", () => {
    const p = producto("1", stocks({ claypole: 2, bernal: 3 }));
    const items = itemsDe([p, "unidad", 100]);
    expect(findNearestWithFullStock(items, SUCURSALES, CLAYPOLE, [p])).toBeNull();
  });
});

describe("mejorCobertura", () => {
  it("elige la sucursal con menos unidades faltantes", () => {
    const p = producto("1", stocks({ claypole: 2, bernal: 8 }));
    const items = itemsDe([p, "unidad", 10]);
    const res = mejorCobertura(items, SUCURSALES, [p]);
    expect(res.sucursal.id).toBe("bernal");
    expect(res.faltantes).toEqual([
      { productId: "1", nombre: "PRODUCTO 1", pedido: 10, disponible: 8 },
    ]);
  });

  it("en empate gana la primera del array (más cercana si viene ordenado)", () => {
    const p = producto("1", stocks({ claypole: 5, bernal: 5 }));
    const items = itemsDe([p, "unidad", 10]);
    const res = mejorCobertura(items, SUCURSALES, [p]);
    expect(res.sucursal.id).toBe("claypole");
  });
});
