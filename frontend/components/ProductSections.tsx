import type { Product } from "@/lib/types";
import { ProductCard } from "./ProductCard";

export function FeaturedProducts({ products }: { products: Product[] }) {
  return (
    <section style={{ marginBottom: 30 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 className="font-condensed" style={{ fontWeight: 800, textTransform: "uppercase", fontSize: 27, margin: 0 }}>
          Productos destacados
        </h2>
        <span style={{ color: "#E63312", fontWeight: 800, fontSize: 13.5, cursor: "pointer" }}>Ver todo →</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

export function OnFireShelf({ products }: { products: Product[] }) {
  return (
    <section style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h2 className="font-condensed" style={{ fontWeight: 800, textTransform: "uppercase", fontSize: 27, margin: 0 }}>
          Ofertas on fire 🔥
        </h2>
        <span style={{ color: "#E63312", fontWeight: 800, fontSize: 13.5, cursor: "pointer" }}>Ver todo →</span>
      </div>
      <div className="shelf" style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8 }}>
        {products.map((p) => (
          <div key={p.id} style={{ flex: "0 0 214px" }}>
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
