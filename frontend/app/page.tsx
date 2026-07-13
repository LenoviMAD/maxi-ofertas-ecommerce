import { PRODUCTS } from "@/lib/products";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { FeaturedProducts, OnFireShelf } from "@/components/ProductSections";
import { PromoBanners } from "@/components/PromoBanners";
import { BrandsSection } from "@/components/BrandsSection";
import { Footer } from "@/components/Footer";

export default function Home() {
  // products.json viene ordenado por descuento desc:
  // top 8 = destacados, los siguientes 12 = ofertas on fire.
  const featured = PRODUCTS.slice(0, 8);
  const onFire = PRODUCTS.slice(8, 20);

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
