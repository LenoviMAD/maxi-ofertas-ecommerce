"use client";

import { useMemo, type CSSProperties } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CATEGORIES, PRODUCTS } from "@/lib/products";
import { ProductCard } from "./ProductCard";

function normalizar(text: string): string {
  // NFD separa los acentos como diacríticos combinantes (U+0300–U+036F) y los borra
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function CatalogoClient() {
  const router = useRouter();
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const cat = params.get("cat");
  const soloOfertas = params.get("ofertas") === "1";

  const filtered = useMemo(() => {
    const nq = normalizar(q.trim());
    return PRODUCTS.filter((p) => {
      if (cat && p.category !== cat) return false;
      if (soloOfertas && p.discountPercent === 0) return false;
      if (nq && !normalizar(p.name).includes(nq)) return false;
      return true;
    });
  }, [q, cat, soloOfertas]);

  const irA = (nuevaCat: string | null, ofertas = false) => {
    const next = new URLSearchParams();
    if (q.trim()) next.set("q", q.trim());
    if (nuevaCat) next.set("cat", nuevaCat);
    if (ofertas) next.set("ofertas", "1");
    const qs = next.toString();
    router.replace(qs ? `/productos?${qs}` : "/productos");
  };

  const chipStyle = (active: boolean): CSSProperties => ({
    border: "1px solid " + (active ? "#E63312" : "#ddd8cd"),
    background: active ? "#E63312" : "#fff",
    color: active ? "#fff" : "#1A1A1A",
    borderRadius: 20,
    padding: "7px 14px",
    fontWeight: 600,
    fontSize: 12.5,
    cursor: "pointer",
    whiteSpace: "nowrap",
  });

  return (
    <>
      <h1 className="font-condensed" style={{ fontWeight: 800, textTransform: "uppercase", fontSize: 32, margin: "0 0 18px" }}>
        Catálogo
      </h1>

      <div className="shelf" style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 10, marginBottom: 8 }}>
        <button style={chipStyle(!cat && !soloOfertas)} onClick={() => irA(null)}>
          Todas
        </button>
        {CATEGORIES.map((c) => (
          <button key={c} style={chipStyle(cat === c)} onClick={() => irA(c)}>
            {c}
          </button>
        ))}
        <button style={chipStyle(soloOfertas)} onClick={() => irA(null, true)}>
          🔥 Ofertas
        </button>
      </div>

      <p style={{ fontSize: 13, color: "#8a8a86", margin: "0 0 16px" }}>
        {filtered.length} producto{filtered.length === 1 ? "" : "s"}
        {q.trim() && <> para «{q.trim()}»</>}
        {cat && <> en {cat}</>}
      </p>

      {filtered.length === 0 ? (
        <p style={{ fontSize: 14, color: "#6b6459" }}>
          No encontramos productos con esos filtros. Probá con otra búsqueda.
        </p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </>
  );
}
