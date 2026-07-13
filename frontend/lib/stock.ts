import type { CartItem, StaticProduct, Sucursal } from "./types";
import type { Coords, SucursalConDistancia } from "./geo";
import { sucursalesPorDistancia } from "./geo";

export function stockDe(product: StaticProduct, sucursalId: string): number {
  return product.stockBySucursal[sucursalId] ?? 0;
}

export interface Faltante {
  productId: string;
  nombre: string;
  pedido: number;
  disponible: number;
}

export type ValidacionCarrito = { ok: true } | { ok: false; faltantes: Faltante[] };

function pedidoPorProducto(items: CartItem[]): Map<string, { nombre: string; pedido: number }> {
  const map = new Map<string, { nombre: string; pedido: number }>();
  for (const item of items) {
    const prev = map.get(item.productId);
    map.set(item.productId, {
      nombre: item.productName,
      pedido: (prev?.pedido ?? 0) + item.quantity,
    });
  }
  return map;
}

export function validateCart(
  items: CartItem[],
  sucursalId: string,
  products: StaticProduct[]
): ValidacionCarrito {
  const byId = new Map(products.map((p) => [p.id, p]));
  const faltantes: Faltante[] = [];
  for (const [productId, { nombre, pedido }] of pedidoPorProducto(items)) {
    const product = byId.get(productId);
    const disponible = product ? stockDe(product, sucursalId) : 0;
    if (pedido > disponible) faltantes.push({ productId, nombre, pedido, disponible });
  }
  return faltantes.length === 0 ? { ok: true } : { ok: false, faltantes };
}

export function findNearestWithFullStock(
  items: CartItem[],
  sucursales: Sucursal[],
  desde: Coords,
  products: StaticProduct[]
): SucursalConDistancia | null {
  for (const sucursal of sucursalesPorDistancia(desde, sucursales)) {
    if (validateCart(items, sucursal.id, products).ok) return sucursal;
  }
  return null;
}

export function mejorCobertura(
  items: CartItem[],
  sucursalesOrdenadas: Sucursal[],
  products: StaticProduct[]
): { sucursal: Sucursal; faltantes: Faltante[] } {
  let best: { sucursal: Sucursal; faltantes: Faltante[]; unidades: number } | null = null;
  for (const sucursal of sucursalesOrdenadas) {
    const res = validateCart(items, sucursal.id, products);
    const faltantes = res.ok ? [] : res.faltantes;
    const unidades = faltantes.reduce((sum, f) => sum + (f.pedido - f.disponible), 0);
    if (!best || unidades < best.unidades) best = { sucursal, faltantes, unidades };
  }
  if (!best) throw new Error("mejorCobertura requiere al menos una sucursal");
  return { sucursal: best.sucursal, faltantes: best.faltantes };
}
