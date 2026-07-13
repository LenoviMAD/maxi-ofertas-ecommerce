"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { SUCURSALES } from "@/lib/data/sucursales";
import type { Coords } from "@/lib/geo";
import { sucursalesPorDistancia } from "@/lib/geo";
import type { Sucursal } from "@/lib/types";

const SUCURSAL_STORAGE_KEY = "maxi_sucursal_v1";
const DEFAULT_SUCURSAL = SUCURSALES[0]; // Claypole

interface StoredState {
  sucursalId: string;
  userCoords: Coords | null;
  hasChosen: boolean;
}

interface SucursalContextValue {
  sucursal: Sucursal;
  userCoords: Coords | null;
  hasChosen: boolean;
  locating: boolean;
  elegirSucursal: (id: string) => void;
  usarMiUbicacion: () => void;
}

const SucursalContext = createContext<SucursalContextValue | undefined>(undefined);

function loadState(): StoredState | null {
  try {
    const raw = window.localStorage.getItem(SUCURSAL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredState;
    if (typeof parsed.sucursalId !== "string") return null;
    return parsed;
  } catch {
    // JSON corrupto o localStorage inaccesible: estado inicial
    return null;
  }
}

function saveState(state: StoredState) {
  try {
    window.localStorage.setItem(SUCURSAL_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage inaccesible: la elección vive solo en memoria
  }
}

export function SucursalProvider({ children }: { children: React.ReactNode }) {
  const [sucursal, setSucursal] = useState<Sucursal>(DEFAULT_SUCURSAL);
  const [userCoords, setUserCoords] = useState<Coords | null>(null);
  const [hasChosen, setHasChosen] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    const stored = loadState();
    if (!stored) return;
    const found = SUCURSALES.find((s) => s.id === stored.sucursalId);
    if (found) setSucursal(found);
    setUserCoords(stored.userCoords ?? null);
    setHasChosen(Boolean(stored.hasChosen));
  }, []);

  const elegirSucursal = useCallback(
    (id: string) => {
      const found = SUCURSALES.find((s) => s.id === id);
      if (!found) return;
      setSucursal(found);
      setHasChosen(true);
      saveState({ sucursalId: id, userCoords, hasChosen: true });
    },
    [userCoords]
  );

  const usarMiUbicacion = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const nearest = sucursalesPorDistancia(coords)[0];
        setUserCoords(coords);
        setSucursal(nearest);
        setHasChosen(true);
        setLocating(false);
        saveState({ sucursalId: nearest.id, userCoords: coords, hasChosen: true });
      },
      () => {
        // Permiso negado o error: sin alerta, queda la selección manual
        setLocating(false);
      },
      { timeout: 8000 }
    );
  }, []);

  return (
    <SucursalContext.Provider
      value={{ sucursal, userCoords, hasChosen, locating, elegirSucursal, usarMiUbicacion }}
    >
      {children}
    </SucursalContext.Provider>
  );
}

export function useSucursal() {
  const ctx = useContext(SucursalContext);
  if (!ctx) throw new Error("useSucursal debe usarse dentro de SucursalProvider");
  return ctx;
}
