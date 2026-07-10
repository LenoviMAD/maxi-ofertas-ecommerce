import { API_URL } from "@/lib/api";
import type { Product } from "@/lib/types";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { FeaturedProducts, OnFireShelf } from "@/components/ProductSections";
import { PromoBanners } from "@/components/PromoBanners";
import { BrandsSection } from "@/components/BrandsSection";
import { Footer } from "@/components/Footer";

async function getProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_URL}/api/products`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function Home() {
  const products = await getProducts();
  const featured = products.slice(0, 8);
  const onFire = products.slice(8);

  return (
    <div style={{ minHeight: "100vh" }}>
      <Header />
      <Hero />
      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "30px 22px 60px" }}>
        <FeaturedProducts products={featured} />
        <PromoBanners />
        <OnFireShelf products={onFire} />
        <BrandsSection />
      </main>
      <Footer />
    </div>
  );
}
