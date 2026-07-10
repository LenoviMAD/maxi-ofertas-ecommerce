import Image from "next/image";
import { withBasePath } from "@/lib/basePath";

export function Footer() {
  return (
    <footer style={{ background: "#1A1A1A", color: "#cfcfcf" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 22px 22px", display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: 28 }}>
        <div>
          <Image src={withBasePath("/images/logo-white.png")} alt="Maxi Ofertas" width={140} height={36} style={{ height: 36, width: "auto", marginBottom: 12 }} />
          <p style={{ fontSize: 13, lineHeight: 1.6, maxWidth: 230, margin: 0 }}>
            Más barato y en un solo lugar. El mayorista de tu negocio.
          </p>
        </div>
        <div>
          <div className="font-condensed" style={{ fontWeight: 700, textTransform: "uppercase", fontSize: 15, color: "#fff", marginBottom: 12 }}>
            Comprar
          </div>
          <div style={{ fontSize: 13, padding: "4px 0" }}>Ofertas de la semana</div>
          <div style={{ fontSize: 13, padding: "4px 0" }}>Comprar por bulto</div>
          <div style={{ fontSize: 13, padding: "4px 0" }}>Categorías</div>
          <div style={{ fontSize: 13, padding: "4px 0" }}>Marcas</div>
        </div>
        <div>
          <div className="font-condensed" style={{ fontWeight: 700, textTransform: "uppercase", fontSize: 15, color: "#fff", marginBottom: 12 }}>
            Ayuda
          </div>
          <div style={{ fontSize: 13, padding: "4px 0" }}>Cómo comprar</div>
          <div style={{ fontSize: 13, padding: "4px 0" }}>Sucursales</div>
          <div style={{ fontSize: 13, padding: "4px 0" }}>Medios de pago</div>
          <div style={{ fontSize: 13, padding: "4px 0" }}>Preguntas frecuentes</div>
        </div>
        <div>
          <div className="font-condensed" style={{ fontWeight: 700, textTransform: "uppercase", fontSize: 15, color: "#fff", marginBottom: 12 }}>
            Contacto
          </div>
          <div style={{ fontSize: 13, padding: "4px 0", display: "flex", alignItems: "center", gap: 7 }}>
            <span className="msym" style={{ fontSize: 16 }}>call</span>0810 222 6294
          </div>
          <div style={{ fontSize: 13, padding: "4px 0", display: "flex", alignItems: "center", gap: 7 }}>
            <span className="msym" style={{ fontSize: 16 }}>mail</span>hola@maxiofertas.com.ar
          </div>
          <div style={{ fontSize: 13, padding: "4px 0", display: "flex", alignItems: "center", gap: 7 }}>
            <span className="msym" style={{ fontSize: 16 }}>schedule</span>Lun a Sáb 8 a 21h
          </div>
        </div>
      </div>
      <div style={{ borderTop: "1px solid #2a2a2a" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "16px 22px", fontSize: 12, color: "#777" }}>
          © 2026 Maxi Ofertas · Todos los derechos reservados
        </div>
      </div>
    </footer>
  );
}
