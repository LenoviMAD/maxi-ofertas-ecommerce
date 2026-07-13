"use client";

import Image from "next/image";
import Link from "next/link";
import { GoogleLogin } from "@react-oauth/google";
import { formatArs } from "@/lib/api";
import { withBasePath } from "@/lib/basePath";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { SucursalSelector } from "./SucursalSelector";

const categories = ["Almacén", "Bebidas", "Lácteos", "Frescos", "Limpieza", "Perfumería", "Bebés", "Mascotas"];

export function Header() {
  const { user, isAuthenticated, loginWithGoogleIdToken, logout } = useAuth();
  const { cart, itemCount } = useCart();

  return (
    <>
      <div style={{ background: "#1A1A1A", color: "#fff", fontSize: 12.5, fontWeight: 500 }}>
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "8px 22px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="msym" style={{ fontSize: 17, color: "#5BD08A" }}>bolt</span>
            <span>
              Retiro en sucursal <b>gratis</b> · listo en 2 hs hábiles
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <SucursalSelector />
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span className="msym" style={{ fontSize: 16 }}>receipt_long</span>Seguí tu pedido
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span className="msym" style={{ fontSize: 16 }}>help</span>Ayuda
            </span>
          </div>
        </div>
      </div>

      <header style={{ background: "#E63312", position: "sticky", top: 0, zIndex: 50, boxShadow: "0 2px 14px rgba(0,0,0,.12)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "14px 22px", display: "flex", alignItems: "center", gap: 18 }}>
          <Link href="/">
            <Image src={withBasePath("/images/logoMaxi.png")} alt="Maxi Ofertas" width={140} height={38} style={{ height: 38, width: "auto" }} priority />
          </Link>
          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#c42a0f",
              color: "#fff",
              border: "none",
              borderRadius: 11,
              padding: "11px 16px",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              flex: "0 0 auto",
            }}
          >
            <span className="msym" style={{ fontSize: 21 }}>menu</span>Categorías
          </button>
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "stretch",
              background: "#fff",
              borderRadius: 12,
              overflow: "hidden",
              minWidth: 0,
              boxShadow: "0 3px 10px rgba(0,0,0,.12)",
            }}
          >
            <input
              placeholder="Buscar productos, marcas y más…"
              style={{ flex: 1, border: "none", padding: "12px 16px", fontSize: 14, outline: "none", minWidth: 0 }}
            />
            <button style={{ background: "#F7941D", color: "#fff", border: "none", padding: "0 20px", cursor: "pointer", display: "flex", alignItems: "center" }}>
              <span className="msym" style={{ fontSize: 24 }}>search</span>
            </button>
          </div>

          {isAuthenticated ? (
            <button
              onClick={logout}
              style={{ display: "flex", alignItems: "center", gap: 9, background: "none", border: "none", color: "#fff", cursor: "pointer", flex: "0 0 auto" }}
              title="Cerrar sesión"
            >
              <span className="msym" style={{ fontSize: 28 }}>account_circle</span>
              <span style={{ textAlign: "left", lineHeight: 1.1 }}>
                <span style={{ display: "block", fontSize: 11, opacity: 0.85 }}>Hola,</span>
                <span style={{ fontSize: 13.5, fontWeight: 700 }}>{user?.displayName ?? user?.email}</span>
              </span>
            </button>
          ) : (
            <div style={{ flex: "0 0 auto" }}>
              <GoogleLogin
                onSuccess={(credential) => {
                  if (credential.credential) {
                    loginWithGoogleIdToken(credential.credential);
                  }
                }}
                onError={() => window.alert("No se pudo iniciar sesión con Google.")}
                text="signin"
                size="medium"
              />
            </div>
          )}

          <Link
            href="/checkout"
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: 9,
              background: "#1A1A1A",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              flex: "0 0 auto",
              borderRadius: 12,
              padding: "10px 16px",
            }}
          >
            <span className="msym" style={{ fontSize: 24 }}>shopping_cart</span>
            <span style={{ lineHeight: 1.1, textAlign: "left" }}>
              <span style={{ display: "block", fontSize: 11, opacity: 0.8 }}>Carrito</span>
              <span style={{ fontSize: 13.5, fontWeight: 800 }}>{formatArs(cart?.total ?? 0)}</span>
            </span>
            {itemCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -6,
                  left: 24,
                  background: "#E91E8C",
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 800,
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid #E63312",
                }}
              >
                {itemCount}
              </span>
            )}
          </Link>
        </div>

        <div style={{ background: "#c42a0f" }}>
          <div className="shelf" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 22px", display: "flex", gap: 2, overflowX: "auto" }}>
            {categories.map((cat) => (
              <div key={cat} style={{ color: "#fff", fontWeight: 600, fontSize: 13, padding: "10px 14px", whiteSpace: "nowrap", cursor: "pointer" }}>
                {cat}
              </div>
            ))}
            <div
              style={{
                color: "#FFD23F",
                fontWeight: 800,
                fontSize: 13,
                padding: "10px 14px",
                whiteSpace: "nowrap",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <span className="msym" style={{ fontSize: 17 }}>sell</span>Ofertas
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
