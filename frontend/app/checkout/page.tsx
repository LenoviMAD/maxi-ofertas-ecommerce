"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import { useSucursal } from "@/context/SucursalContext";
import { formatArs } from "@/lib/api";
import { SUCURSALES } from "@/lib/data/sucursales";
import { formatKm, sucursalesPorDistancia } from "@/lib/geo";
import { PRODUCTS } from "@/lib/products";
import { findNearestWithFullStock, mejorCobertura, validateCart } from "@/lib/stock";

export default function CheckoutPage() {
  const { cart, loading, updateItemQuantity, removeItem, checkout } = useCart();
  const { sucursal, userCoords, elegirSucursal } = useSucursal();
  const router = useRouter();
  const [placing, setPlacing] = useState(false);
  const [confirmado, setConfirmado] = useState<{
    orderId: string;
    sucursalNombre: string;
    direccion: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cambiandoSucursal, setCambiandoSucursal] = useState(false);

  const items = cart?.items ?? [];
  const total = cart?.total ?? 0;

  const desde = useMemo(
    () => userCoords ?? { lat: sucursal.lat, lng: sucursal.lng },
    [userCoords, sucursal]
  );
  const validacion = useMemo(
    () => validateCart(items, sucursal.id, PRODUCTS),
    [items, sucursal.id]
  );
  const alternativa = useMemo(
    () => (validacion.ok ? null : findNearestWithFullStock(items, SUCURSALES, desde, PRODUCTS)),
    [validacion, items, desde]
  );
  const cobertura = useMemo(
    () =>
      validacion.ok || alternativa
        ? null
        : mejorCobertura(items, sucursalesPorDistancia(desde), PRODUCTS),
    [validacion, alternativa, items, desde]
  );

  const handleCheckout = async () => {
    setPlacing(true);
    setError(null);
    try {
      const order = await checkout();
      setConfirmado({
        orderId: order.id,
        sucursalNombre: sucursal.nombre,
        direccion: sucursal.direccion,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo completar la compra.");
    } finally {
      setPlacing(false);
    }
  };

  const ajustarCantidades = () => {
    document.getElementById("cart-items")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "40px 22px 60px", flex: 1, width: "100%" }}>
        <h1 className="font-condensed" style={{ fontWeight: 800, textTransform: "uppercase", fontSize: 32, marginBottom: 24 }}>
          Tu pedido
        </h1>

        {loading && <p style={{ fontSize: 14, color: "#6b6459" }}>Cargando tu carrito…</p>}

        {!loading && confirmado && (
          <div style={{ background: "#12A050", color: "#fff", padding: 20, borderRadius: 12, marginBottom: 20 }}>
            ¡Pedido confirmado! Número de pedido: <b>{confirmado.orderId}</b>
            <div style={{ marginTop: 6, fontSize: 13.5 }}>
              Retirás en <b>{confirmado.sucursalNombre}</b> — {confirmado.direccion}
            </div>
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

        {!loading && !confirmado && items.length === 0 && (
          <p style={{ fontSize: 14, color: "#6b6459" }}>
            Tu carrito está vacío.{" "}
            <button
              onClick={() => router.push("/productos")}
              style={{ background: "none", border: "none", color: "#E63312", fontWeight: 700, cursor: "pointer", fontSize: 14, padding: 0 }}
            >
              Ver el catálogo
            </button>
          </p>
        )}

        {!loading && !confirmado && items.length > 0 && (
          <>
            <div
              style={{
                background: "#fff",
                border: "1px solid #ececec",
                borderRadius: 12,
                padding: 14,
                marginBottom: 20,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em", color: "#8a8a86", fontWeight: 700 }}>
                  Retirás en
                </div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>
                  {sucursal.nombre} — <span style={{ fontWeight: 500 }}>{sucursal.direccion}</span>
                </div>
              </div>
              {cambiandoSucursal ? (
                <select
                  value={sucursal.id}
                  onChange={(e) => {
                    elegirSucursal(e.target.value);
                    setCambiandoSucursal(false);
                  }}
                  style={{ padding: 8, borderRadius: 8, border: "1px solid #ddd8cd", fontSize: 13 }}
                >
                  {SUCURSALES.map((s) => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              ) : (
                <button
                  onClick={() => setCambiandoSucursal(true)}
                  style={{ background: "none", border: "none", color: "#E63312", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                >
                  cambiar
                </button>
              )}
            </div>

            <div id="cart-items" style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
              {items.map((item) => (
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
                {formatArs(total)}
              </span>
            </div>

            {error && <p style={{ color: "#E63312", fontSize: 13, marginBottom: 12 }}>{error}</p>}

            {!validacion.ok ? (
              <div style={{ background: "#FFF4E5", border: "1px solid #F57C00", borderRadius: 12, padding: 16 }}>
                <div style={{ fontWeight: 800, marginBottom: 8, color: "#B25000", display: "flex", alignItems: "center", gap: 6 }}>
                  <span className="msym" style={{ fontSize: 18 }}>warning</span>
                  {sucursal.nombre} no tiene stock suficiente para tu pedido
                </div>
                <ul style={{ margin: "0 0 12px", paddingLeft: 18, fontSize: 13, color: "#6b4a1f" }}>
                  {validacion.faltantes.map((f) => (
                    <li key={f.productId}>
                      {f.nombre}: pediste {f.pedido}, hay {f.disponible}
                    </li>
                  ))}
                </ul>

                {alternativa && (
                  <>
                    <p style={{ fontSize: 13.5, margin: "0 0 10px" }}>
                      <b>{alternativa.nombre}</b> (a {formatKm(alternativa.distanciaKm)}) tiene todo tu pedido.
                    </p>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button
                        onClick={() => elegirSucursal(alternativa.id)}
                        style={{ background: "#E63312", color: "#fff", border: "none", borderRadius: 8, padding: "11px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                      >
                        Retirar en {alternativa.nombre}
                      </button>
                      <button
                        onClick={ajustarCantidades}
                        style={{ background: "#fff", color: "#1A1A1A", border: "1px solid #ddd8cd", borderRadius: 8, padding: "11px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                      >
                        Ajustar cantidades
                      </button>
                    </div>
                  </>
                )}

                {!alternativa && cobertura && (
                  <>
                    <p style={{ fontSize: 13.5, margin: "0 0 10px" }}>
                      Ninguna sucursal cubre todo el pedido. La que más se acerca es{" "}
                      <b>{cobertura.sucursal.nombre}</b>
                      {cobertura.faltantes.map(
                        (f) => ` · le faltan ${f.pedido - f.disponible} unidades de ${f.nombre}`
                      )}
                      .
                    </p>
                    <button
                      onClick={ajustarCantidades}
                      style={{ background: "#fff", color: "#1A1A1A", border: "1px solid #ddd8cd", borderRadius: 8, padding: "11px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                    >
                      Ajustar cantidades
                    </button>
                  </>
                )}
              </div>
            ) : (
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
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
