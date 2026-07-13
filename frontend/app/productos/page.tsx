import { Suspense } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CatalogoClient } from "@/components/CatalogoClient";

export default function ProductosPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />
      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "30px 22px 60px", flex: 1, width: "100%" }}>
        {/* useSearchParams exige Suspense en prerender estático (docs Next 16) */}
        <Suspense fallback={null}>
          <CatalogoClient />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
