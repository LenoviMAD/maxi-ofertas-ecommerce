const brands = ["Quilmes", "Manaos", "Serenísima", "Marolio", "Bagley", "Lucchetti"];

export function BrandsSection() {
  return (
    <section style={{ background: "#fff", border: "1px solid #ececec", borderRadius: 18, padding: "22px 24px" }}>
      <h2 className="font-condensed" style={{ fontWeight: 800, textTransform: "uppercase", fontSize: 24, margin: "0 0 16px" }}>
        Marcas destacadas
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 12 }}>
        {brands.map((brand) => (
          <div
            key={brand}
            className="font-condensed"
            style={{
              height: 64,
              border: "1px solid #eee",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 19,
              color: "#9a9388",
            }}
          >
            {brand}
          </div>
        ))}
      </div>
    </section>
  );
}
