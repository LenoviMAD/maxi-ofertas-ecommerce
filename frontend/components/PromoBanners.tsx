import Image from "next/image";
import { withBasePath } from "@/lib/basePath";

export function PromoBanners() {
  return (
    <>
      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div
          style={{
            position: "relative",
            borderRadius: 18,
            overflow: "hidden",
            background: "linear-gradient(120deg,#3a1414,#5c1c1c)",
            padding: "26px 28px",
            minHeight: 170,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <span className="font-mono" style={{ fontSize: 11, color: "#e0a2a2", fontWeight: 700, letterSpacing: ".1em" }}>
            BEBIDAS · VINOS
          </span>
          <div className="font-condensed" style={{ fontWeight: 800, textTransform: "uppercase", color: "#fff", fontSize: 32, lineHeight: 0.9, margin: "8px 0 10px" }}>
            Brindá por menos
          </div>
          <a href="#" style={{ color: "#F7941D", fontWeight: 700, fontSize: 13, textDecoration: "underline" }}>
            Ver bodega →
          </a>
          <Image
            src={withBasePath("/images/mascota-traje-vino.png")}
            alt=""
            width={180}
            height={180}
            style={{ position: "absolute", right: 6, bottom: -10, height: 180, width: "auto", filter: "drop-shadow(0 12px 16px rgba(0,0,0,.3))" }}
          />
        </div>
        <div
          style={{
            position: "relative",
            borderRadius: 18,
            overflow: "hidden",
            background: "linear-gradient(120deg,#FCE4D0,#FBEFDD)",
            padding: "26px 28px",
            minHeight: 170,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <span className="font-mono" style={{ fontSize: 11, color: "#b5793a", fontWeight: 700, letterSpacing: ".1em" }}>
            TEMPORADA · INVIERNO
          </span>
          <div className="font-condensed" style={{ fontWeight: 800, textTransform: "uppercase", fontSize: 32, lineHeight: 0.9, margin: "8px 0 10px", maxWidth: 230 }}>
            Ofertas que abrigan
          </div>
          <a href="#" style={{ color: "#E63312", fontWeight: 700, fontSize: 13, textDecoration: "underline" }}>
            Temporada fría →
          </a>
          <Image
            src={withBasePath("/images/mascota-campera.png")}
            alt=""
            width={190}
            height={190}
            style={{ position: "absolute", right: 0, bottom: -14, height: 190, width: "auto", filter: "drop-shadow(0 12px 16px rgba(0,0,0,.2))" }}
          />
        </div>
      </section>

      <section style={{ marginBottom: 30 }}>
        <div
          style={{
            position: "relative",
            borderRadius: 18,
            overflow: "hidden",
            background: "#EAF3FB",
            padding: "30px 34px",
            display: "flex",
            alignItems: "center",
            gap: 26,
            minHeight: 170,
          }}
        >
          <Image
            src={withBasePath("/images/mascota-afa-pelota.png")}
            alt=""
            width={180}
            height={180}
            style={{ height: 180, width: "auto", flex: "0 0 auto", filter: "drop-shadow(0 14px 18px rgba(0,0,0,.15))" }}
          />
          <div style={{ flex: 1 }}>
            <span
              className="font-mono"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                color: "#2E6DA4",
                fontWeight: 700,
                fontSize: 11,
                letterSpacing: ".08em",
                textTransform: "uppercase",
              }}
            >
              ⚽ Vamos Argentina
            </span>
            <div className="font-condensed" style={{ fontWeight: 800, textTransform: "uppercase", fontSize: 36, lineHeight: 0.92, margin: "10px 0 8px", color: "#1A1A1A" }}>
              Se juega, se festeja con Maxi
            </div>
            <div style={{ fontSize: 14, color: "#4a5a68", fontWeight: 500, maxWidth: 460 }}>
              Bebidas, snacks y todo para el picada party. Combos especiales por cada fecha de la Selección.
            </div>
          </div>
          <button
            style={{
              background: "#74ACDF",
              color: "#fff",
              border: "none",
              fontWeight: 800,
              fontSize: 14,
              padding: "14px 26px",
              borderRadius: 11,
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: ".03em",
              whiteSpace: "nowrap",
              flex: "0 0 auto",
            }}
          >
            Ver combos del partido
          </button>
        </div>
      </section>
    </>
  );
}
