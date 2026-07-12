import type { Cart, CartItem, PriceMode, StaticProduct } from "./types";

export function emptyCart(): Cart {
  return { id: "local", items: [], total: 0 };
}

function pricePerUnit(product: StaticProduct, mode: PriceMode): number {
  return mode === "bulto" ? product.bultoPrice / product.bultoQty : product.unitPrice;
}

function withTotals(items: CartItem[]): Cart {
  const recomputed = items.map((i) => ({ ...i, subtotal: i.unitPrice * i.quantity }));
  return {
    id: "local",
    items: recomputed,
    total: recomputed.reduce((sum, i) => sum + i.subtotal, 0),
  };
}

export function addItem(
  cart: Cart,
  product: StaticProduct,
  mode: PriceMode,
  quantity: number
): Cart {
  const itemId = `${product.id}:${mode}`;
  const existing = cart.items.find((i) => i.id === itemId);
  const items = existing
    ? cart.items.map((i) =>
        i.id === itemId ? { ...i, quantity: i.quantity + quantity } : i
      )
    : [
        ...cart.items,
        {
          id: itemId,
          productId: product.id,
          productName: product.name,
          mode,
          quantity,
          unitPrice: pricePerUnit(product, mode),
          subtotal: 0, // withTotals lo recalcula
        },
      ];
  return withTotals(items);
}

export function updateItemQuantity(cart: Cart, itemId: string, quantity: number): Cart {
  if (quantity <= 0) return removeItem(cart, itemId);
  return withTotals(cart.items.map((i) => (i.id === itemId ? { ...i, quantity } : i)));
}

export function removeItem(cart: Cart, itemId: string): Cart {
  return withTotals(cart.items.filter((i) => i.id !== itemId));
}
