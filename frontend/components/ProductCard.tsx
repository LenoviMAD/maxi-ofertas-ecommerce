"use client";

import { useState } from "react";
import { formatArs } from "@/lib/api";
import type { PriceMode, Product } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

export function ProductCard({ product }: { product: Product }) {
  const [mode, setMode] = useState<PriceMode>("unidad");
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();

  const isBulto = mode === "bulto";
  const bigPrice = isBulto ? product.bultoPrice : product.unitPrice;
  const subLabel = isBulto
    ? `Por unidad: ${formatArs(product.unitPrice)}`
    : `Bulto x${product.bultoQty}: ${formatArs(product.bultoPrice)}`;

  const handleAdd = async () => {
    if (!isAuthenticated) {
      window.alert("Iniciá sesión con Google para agregar productos al carrito.");
      return;
    }
    await addItem(product.id, mode, isBulto ? product.bultoQty : 1);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        background: "#fff",
        border: "1px solid #ececec",
        borderRadius: 10,
        overflow: "hidden",
        height: "100%",
      }}
    >
      <div
        style={{
          position: "relative",
          height: 148,
          background: "#f1f1f0",
          backgroundImage:
            "repeating-linear-gradient(45deg,#e8e8e5 0 11px,#f3f3f1 11px 22px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span className="font-mono" style={{ fontSize: 10, letterSpacing: ".06em", color: "#a2a29d", textTransform: "uppercase" }}>
          foto producto
        </span>
        {product.discountPercent > 0 && (
          <span
            className="font-condensed"
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              background: "#E63312",
              color: "#fff",
              fontWeight: 700,
              fontSize: 16,
              lineHeight: 1,
              padding: "3px 8px",
              borderRadius: 5,
            }}
          >
            -{product.discountPercent}%
          </span>
        )}
        {product.lastUnits && (
          <span
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              background: "#F57C00",
              color: "#fff",
              fontWeight: 700,
              fontSize: 9,
              letterSpacing: ".04em",
              padding: "4px 7px",
              borderRadius: 5,
              textTransform: "uppercase",
            }}
          >
            Últimas unidades
          </span>
        )}
        {product.freeShipping && (
          <span
            style={{
              position: "absolute",
              bottom: 8,
              left: 8,
              background: "#2E7D32",
              color: "#fff",
              fontWeight: 700,
              fontSize: 9,
              letterSpacing: ".04em",
              padding: "4px 7px",
              borderRadius: 5,
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span className="msym" style={{ fontSize: 12 }}>local_shipping</span>
            Envío gratis
          </span>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 7, padding: 12, flex: 1 }}>
        <span style={{ fontWeight: 600, fontSize: 10, letterSpacing: ".07em", textTransform: "uppercase", color: "#E63312" }}>
          {product.category}
        </span>
        <span
          style={{
            fontWeight: 600,
            fontSize: 14.5,
            lineHeight: 1.25,
            color: "#1A1A1A",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: 36,
          }}
        >
          {product.name}
        </span>
        <div style={{ display: "flex", gap: 4, background: "#f4f4f2", borderRadius: 7, padding: 3 }}>
          <button
            onClick={() => setMode("unidad")}
            style={{
              flex: 1,
              border: "none",
              borderRadius: 5,
              padding: 5,
              fontWeight: 600,
              fontSize: 11,
              cursor: "pointer",
              background: isBulto ? "#fff" : "#1A1A1A",
              color: isBulto ? "#6a6a66" : "#fff",
            }}
          >
            Unidad
          </button>
          <button
            onClick={() => setMode("bulto")}
            style={{
              flex: 1,
              border: "none",
              borderRadius: 5,
              padding: 5,
              fontWeight: 600,
              fontSize: 11,
              cursor: "pointer",
              background: isBulto ? "#1A1A1A" : "#fff",
              color: isBulto ? "#fff" : "#6a6a66",
            }}
          >
            Bulto
          </button>
        </div>
        <div style={{ marginTop: "auto" }}>
          <div className="font-condensed" style={{ fontWeight: 700, fontSize: 30, lineHeight: 1, color: "#E63312" }}>
            {formatArs(bigPrice)}
          </div>
          <div style={{ fontSize: 11.5, color: "#8a8a86", marginTop: 3 }}>{subLabel}</div>
        </div>
        <button
          onClick={handleAdd}
          style={{
            marginTop: 4,
            background: "#E63312",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: 11,
            fontWeight: 700,
            fontSize: 12.5,
            textTransform: "uppercase",
            letterSpacing: ".03em",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <span className="msym" style={{ fontSize: 17 }}>add_shopping_cart</span>
          Agregar
        </button>
      </div>
    </div>
  );
}
