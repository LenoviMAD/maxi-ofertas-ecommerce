"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { formatArs } from "@/lib/api";

export default function CheckoutPage() {
  const { isAuthenticated } = useAuth();
  const { cart, updateItemQuantity, removeItem, checkout } = useCart();
  const router = useRouter();
  const [placing, setPlacing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setPlacing(true);
    setError(null);
    try {
      const order = await checkout();
      setOrderId(order.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo completar la compra.");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "40px 22px 60px", flex: 1, width: "100%" }}>
        <h1 className="font-condensed" style={{ fontWeight: 800, textTransform: "uppercase", fontSize: 32, marginBottom: 24 }}>
          Tu pedido
        </h1>

        {!isAuthenticated && (
          <p style={{ fontSize: 14, color: "#6b6459" }}>Iniciá sesión con Google para ver y confirmar tu carrito.</p>
        )}

        {isAuthenticated && orderId && (
          <div style={{ background: "#12A050", color: "#fff", padding: 20, borderRadius: 12, marginBottom: 20 }}>
            ¡Pedido confirmado! Número de pedido: <b>{orderId}</b>
            <div style={{ marginTop: 12 }}>
              <button
                onClick={() => router.push("/")}
                style={{ background: "#fff", color: "#12A050", border: "none", borderRadius: 8, padding: "10px 16px", fontWeight: 700, cursor: "pointer" }}
              >
                Volver al inicio
              </button>
            </div>
          </div>
        )}

        {isAuthenticated && !orderId && cart && cart.items.length === 0 && (
          <p style={{ fontSize: 14, color: "#6b6459" }}>Tu carrito está vacío.</p>
        )}

        {isAuthenticated && !orderId && cart && cart.items.length > 0 && (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
              {cart.items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    background: "#fff",
                    border: "1px solid #ececec",
                    borderRadius: 12,
                    padding: 14,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{item.productName}</div>
                    <div style={{ fontSize: 12, color: "#8a8a86" }}>
                      {item.mode === "bulto" ? "Bulto" : "Unidad"} · {formatArs(item.unitPrice)} c/u
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <input
                      type="number"
                      min={0}
                      value={item.quantity}
                      onChange={(e) => updateItemQuantity(item.id, Number(e.target.value))}
                      style={{ width: 56, padding: 6, border: "1px solid #ddd8cd", borderRadius: 6 }}
                    />
                    <div className="font-condensed" style={{ fontWeight: 700, fontSize: 18, minWidth: 90, textAlign: "right" }}>
                      {formatArs(item.subtotal)}
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      style={{ background: "none", border: "none", color: "#E63312", cursor: "pointer" }}
                      title="Quitar"
                    >
                      <span className="msym" style={{ fontSize: 20 }}>delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <span className="font-condensed" style={{ fontWeight: 700, fontSize: 22, textTransform: "uppercase" }}>
                Total
              </span>
              <span className="font-condensed" style={{ fontWeight: 800, fontSize: 30, color: "#E63312" }}>
                {formatArs(cart.total)}
              </span>
            </div>

            {error && <p style={{ color: "#E63312", fontSize: 13, marginBottom: 12 }}>{error}</p>}

            <button
              onClick={handleCheckout}
              disabled={placing}
              style={{
                width: "100%",
                background: "#E63312",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: 14,
                fontWeight: 800,
                fontSize: 14,
                textTransform: "uppercase",
                cursor: placing ? "default" : "pointer",
                opacity: placing ? 0.7 : 1,
              }}
            >
              {placing ? "Confirmando…" : "Confirmar compra"}
            </button>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
