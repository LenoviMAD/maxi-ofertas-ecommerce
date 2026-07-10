import Image from "next/image";

export function Hero() {
  return (
    <section
      style={{
        position: "relative",
        background: "linear-gradient(120deg,#F7941D 0%,#F0563E 46%,#E91E8C 100%)",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", top: -60, right: 120, width: 420, height: 420, borderRadius: "50%", background: "rgba(255,255,255,.10)" }} />
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "34px 22px 26px", display: "flex", alignItems: "center", gap: 24, position: "relative" }}>
        <div style={{ flex: 1, maxWidth: 520, color: "#fff", position: "relative", zIndex: 2 }}>
          <span
            className="font-mono"
            style={{
              display: "inline-block",
              background: "#1A1A1A",
              color: "#FFD23F",
              fontWeight: 800,
              fontSize: 11,
              letterSpacing: ".08em",
              textTransform: "uppercase",
              padding: "6px 13px",
              borderRadius: 6,
            }}
          >
            Mayorista · precios de mayorista
          </span>
          <h1 className="font-condensed" style={{ fontWeight: 800, textTransform: "uppercase", fontSize: 58, lineHeight: 0.88, margin: "16px 0 12px" }}>
            Ofertas de la
            <br />
            semana
          </h1>
          <p style={{ fontSize: 15, margin: "0 0 22px", opacity: 0.96, fontWeight: 500, maxWidth: 380, lineHeight: 1.5 }}>
            Más barato y en un solo lugar. Comprá por unidad o por bulto y llevate los mejores precios del mayorista.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              style={{
                background: "#1A1A1A",
                color: "#fff",
                border: "none",
                borderRadius: 11,
                padding: "14px 26px",
                fontWeight: 800,
                fontSize: 13.5,
                textTransform: "uppercase",
                letterSpacing: ".03em",
                cursor: "pointer",
              }}
            >
              Ver ofertas
            </button>
            <button
              style={{
                background: "#fff",
                color: "#E63312",
                border: "none",
                borderRadius: 11,
                padding: "14px 26px",
                fontWeight: 800,
                fontSize: 13.5,
                textTransform: "uppercase",
                letterSpacing: ".03em",
                cursor: "pointer",
              }}
            >
              Comprar por bulto
            </button>
          </div>
        </div>
        <div style={{ flex: "0 0 auto", position: "relative", zIndex: 2 }}>
          <Image
            src="/images/mascota-celebra.png"
            alt=""
            width={300}
            height={300}
            style={{
              height: 300,
              width: "auto",
              filter: "drop-shadow(0 20px 26px rgba(0,0,0,.25))",
              animation: "floaty 5s ease-in-out infinite",
            }}
            priority
          />
        </div>
      </div>
    </section>
  );
}
