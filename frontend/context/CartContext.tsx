"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import * as ops from "@/lib/cart";
import { PRODUCT_BY_ID } from "@/lib/products";
import type { Cart, Order, PriceMode } from "@/lib/types";

const CART_STORAGE_KEY = "maxi_cart_v1";

interface CartContextValue {
  cart: Cart | null;
  loading: boolean;
  addItem: (productId: string, mode: PriceMode, quantity: number) => Promise<void>;
  updateItemQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  checkout: () => Promise<Order>;
  itemCount: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

function loadCart(): Cart {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return ops.emptyCart();
    const parsed = JSON.parse(raw) as Cart;
    if (!Array.isArray(parsed.items) || typeof parsed.total !== "number") {
      return ops.emptyCart();
    }
    return parsed;
  } catch {
    // JSON corrupto o localStorage inaccesible: arrancar de cero
    return ops.emptyCart();
  }
}

function saveCart(cart: Cart) {
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch {
    // localStorage inaccesible (incógnito estricto): seguimos en memoria
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart>(ops.emptyCart());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setCart(loadCart());
    setLoading(false);
  }, []);

  const addItem = useCallback(
    async (productId: string, mode: PriceMode, quantity: number) => {
      const product = PRODUCT_BY_ID.get(productId);
      if (!product) throw new Error(`Producto desconocido: ${productId}`);
      const next = ops.addItem(cart, product, mode, quantity);
      setCart(next);
      saveCart(next);
    },
    [cart]
  );

  const updateItemQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      const next = ops.updateItemQuantity(cart, itemId, quantity);
      setCart(next);
      saveCart(next);
    },
    [cart]
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      const next = ops.removeItem(cart, itemId);
      setCart(next);
      saveCart(next);
    },
    [cart]
  );

  const checkout = useCallback(async (): Promise<Order> => {
    const order: Order = {
      id: `MX-${Date.now().toString(36).toUpperCase()}`,
      status: "Pending",
      createdAt: new Date().toISOString(),
      total: cart.total,
      items: cart.items,
    };
    const next = ops.emptyCart();
    setCart(next);
    saveCart(next);
    return order;
  }, [cart]);

  const itemCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ cart, loading, addItem, updateItemQuantity, removeItem, checkout, itemCount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de CartProvider");
  return ctx;
}
