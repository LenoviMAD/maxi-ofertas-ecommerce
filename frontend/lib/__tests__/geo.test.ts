import { describe, expect, it } from "vitest";
import { SUCURSALES } from "../data/sucursales";
import { formatKm, haversineKm, sucursalesPorDistancia } from "../geo";

const CLAYPOLE = { lat: SUCURSALES[0].lat, lng: SUCURSALES[0].lng };

describe("haversineKm", () => {
  it("da 0 para el mismo punto", () => {
    expect(haversineKm(CLAYPOLE, CLAYPOLE)).toBe(0);
  });

  it("Obelisco → Catedral de La Plata ≈ 52 km", () => {
    const obelisco = { lat: -34.6037, lng: -58.3816 };
    const catedral = { lat: -34.9214, lng: -57.9544 };
    const km = haversineKm(obelisco, catedral);
    expect(km).toBeGreaterThan(45);
    expect(km).toBeLessThan(60);
  });

  it("es simétrica", () => {
    const a = { lat: -34.7, lng: -58.3 };
    const b = { lat: -34.9, lng: -58.0 };
    expect(haversineKm(a, b)).toBeCloseTo(haversineKm(b, a), 10);
  });
});

describe("sucursalesPorDistancia", () => {
  it("devuelve las 8 ordenadas ascendente con distanciaKm", () => {
    const result = sucursalesPorDistancia(CLAYPOLE);
    expect(result).toHaveLength(8);
    expect(result[0].id).toBe("claypole");
    expect(result[0].distanciaKm).toBe(0);
    for (let i = 1; i < result.length; i++) {
      expect(result[i].distanciaKm).toBeGreaterThanOrEqual(result[i - 1].distanciaKm);
    }
  });

  it("no muta el array original", () => {
    const antes = SUCURSALES.map((s) => s.id);
    sucursalesPorDistancia({ lat: -34.9557, lng: -57.9645 });
    expect(SUCURSALES.map((s) => s.id)).toEqual(antes);
  });
});

describe("formatKm", () => {
  it("formatea con coma decimal y un dígito", () => {
    expect(formatKm(4.234)).toBe("4,2 km");
    expect(formatKm(0)).toBe("0,0 km");
    expect(formatKm(12)).toBe("12,0 km");
  });
});
