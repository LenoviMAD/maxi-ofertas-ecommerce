"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { Cart, Order, PriceMode } from "@/lib/types";
import { useAuth } from "./AuthContext";

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

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(null);
      return;
    }
    setLoading(true);
    try {
      const data = await apiFetch<Cart>("/api/cart");
      setCart(data);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addItem = useCallback(
    async (productId: string, mode: PriceMode, quantity: number) => {
      const data = await apiFetch<Cart>("/api/cart/items", {
        method: "POST",
        body: JSON.stringify({ productId, mode, quantity }),
      });
      setCart(data);
    },
    []
  );

  const updateItemQuantity = useCallback(async (itemId: string, quantity: number) => {
    const data = await apiFetch<Cart>(`/api/cart/items/${itemId}`, {
      method: "PUT",
      body: JSON.stringify({ quantity }),
    });
    setCart(data);
  }, []);

  const removeItem = useCallback(async (itemId: string) => {
    const data = await apiFetch<Cart>(`/api/cart/items/${itemId}`, { method: "DELETE" });
    setCart(data);
  }, []);

  const checkout = useCallback(async () => {
    const order = await apiFetch<Order>("/api/orders", { method: "POST" });
    setCart((prev) => (prev ? { ...prev, items: [], total: 0 } : prev));
    return order;
  }, []);

  const itemCount = cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;

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
