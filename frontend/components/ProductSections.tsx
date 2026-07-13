import Link from "next/link";
import type { StaticProduct } from "@/lib/types";
import { ProductCard } from "./ProductCard";

export function FeaturedProducts({ products }: { products: StaticProduct[] }) {
  return (
    <section style={{ marginBottom: 30 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 className="font-condensed" style={{ fontWeight: 800, textTransform: "uppercase", fontSize: 27, margin: 0 }}>
          Productos destacados
        </h2>
        <Link href="/productos" style={{ color: "#E63312", fontWeight: 800, fontSize: 13.5 }}>
          Ver todo →
        </Link>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

export function OnFireShelf({ products }: { products: StaticProduct[] }) {
  return (
    <section style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h2 className="font-condensed" style={{ fontWeight: 800, textTransform: "uppercase", fontSize: 27, margin: 0 }}>
          Ofertas on fire 🔥
        </h2>
        <Link href="/productos?ofertas=1" style={{ color: "#E63312", fontWeight: 800, fontSize: 13.5 }}>
          Ver todo →
        </Link>
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
