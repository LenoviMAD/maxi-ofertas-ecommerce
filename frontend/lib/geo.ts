import type { Sucursal } from "./types";
import { SUCURSALES } from "./data/sucursales";

export interface Coords {
  lat: number;
  lng: number;
}

export interface SucursalConDistancia extends Sucursal {
  distanciaKm: number;
}

const EARTH_RADIUS_KM = 6371;

export function haversineKm(a: Coords, b: Coords): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export function sucursalesPorDistancia(
  desde: Coords,
  sucursales: Sucursal[] = SUCURSALES
): SucursalConDistancia[] {
  return sucursales
    .map((s) => ({ ...s, distanciaKm: haversineKm(desde, { lat: s.lat, lng: s.lng }) }))
    .sort((a, b) => a.distanciaKm - b.distanciaKm);
}

export function formatKm(km: number): string {
  return `${km.toFixed(1).replace(".", ",")} km`;
}
