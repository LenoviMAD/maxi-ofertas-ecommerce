"use client";

import { useEffect, useRef, useState } from "react";
import { useSucursal } from "@/context/SucursalContext";
import { SUCURSALES } from "@/lib/data/sucursales";
import { formatKm, sucursalesPorDistancia } from "@/lib/geo";

export function SucursalSelector() {
  const { sucursal, userCoords, hasChosen, locating, elegirSucursal, usarMiUbicacion } =
    useSucursal();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  const lista: Array<(typeof SUCURSALES)[number] & { distanciaKm: number | null }> = userCoords
    ? sucursalesPorDistancia(userCoords)
    : SUCURSALES.map((s) => ({ ...s, distanciaKm: null }));

  const distanciaActiva = lista.find((s) => s.id === sucursal.id)?.distanciaKm ?? null;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "none",
          border: "none",
          color: hasChosen ? "#fff" : "#FFD23F",
          cursor: "pointer",
          fontSize: 12.5,
          fontWeight: 600,
          padding: 0,
          fontFamily: "inherit",
        }}
      >
        <span className="msym" style={{ fontSize: 16 }}>location_on</span>
        {hasChosen ? (
          <>
            Retirás en <b>{sucursal.nombre}</b>
            {distanciaActiva != null && (
              <span style={{ opacity: 0.75 }}>({formatKm(distanciaActiva)})</span>
            )}
          </>
        ) : (
          "Elegí tu sucursal"
        )}
        <span className="msym" style={{ fontSize: 16 }}>
          {open ? "expand_less" : "expand_more"}
        </span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            background: "#fff",
            color: "#1A1A1A",
            borderRadius: 10,
            boxShadow: "0 8px 30px rgba(0,0,0,.25)",
            width: 300,
            zIndex: 100,
            overflow: "hidden",
          }}
        >
          <button
            onClick={usarMiUbicacion}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              padding: "12px 14px",
              border: "none",
              borderBottom: "1px solid #ececec",
              background: "#fff",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 13,
              color: "#E63312",
              fontFamily: "inherit",
            }}
          >
            <span className="msym" style={{ fontSize: 18 }}>my_location</span>
            {locating ? "Buscando tu ubicación…" : "Usar mi ubicación"}
          </button>
          {lista.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                elegirSucursal(s.id);
                setOpen(false);
              }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 2,
                width: "100%",
                padding: "10px 14px",
                border: "none",
                background: s.id === sucursal.id ? "#fdf1ee" : "#fff",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "inherit",
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 13 }}>
                {s.nombre}
                {s.distanciaKm != null && (
                  <span style={{ fontWeight: 500, color: "#8a8a86" }}>
                    {" "}· {formatKm(s.distanciaKm)}
                  </span>
                )}
              </span>
              <span style={{ fontSize: 11.5, color: "#8a8a86" }}>{s.direccion}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
