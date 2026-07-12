# Modo estático (productos + sucursales + cercanía) — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/superpowers/specs/2026-07-12-static-sucursales-design.md` (aprobado)

**Goal:** Que el front funcione completo sin backend: ~200 productos reales generados del Excel `MAESTRO.xlsx`, 8 sucursales reales con stock inventado determinístico, carrito en localStorage sin login, y checkout que valida stock por sucursal y sugiere la más cercana que cubra el pedido.

**Architecture:** Script Python committeado genera `frontend/lib/data/products.json`; toda la lógica de carrito/stock/distancia vive en módulos puros (`lib/cart.ts`, `lib/stock.ts`, `lib/geo.ts`) testeados con vitest; dos contextos client (`CartContext` reescrito a localStorage, `SucursalContext` nuevo) alimentan Header, ProductCard, catálogo y checkout. El backend .NET no se toca.

**Tech Stack:** Next.js 16.2.10 (App Router, `output: "export"`), React 19.2.4, TypeScript 5, vitest (nuevo devDependency), Python 3.13 + openpyxl 3.1.5 (solo para el generador).

## Global Constraints

- `output: "export"` — no hay servidor: nada de route handlers dinámicos, Server Actions, ni fetch a APIs propias. Todos los datos se importan en build; toda la lógica corre en el navegador.
- Deploy en GitHub Pages con `basePath` condicionado por env `GITHUB_PAGES=true` (ver `next.config.ts`). Navegación interna siempre con `<Link>`/`router.push` (aplican basePath solos); assets estáticos con `withBasePath()` de `lib/basePath.ts`.
- **La interfaz pública de `CartContext` no cambia:** `cart: Cart | null`, `loading`, `addItem(productId, mode, quantity)`, `updateItemQuantity(itemId, quantity)`, `removeItem(itemId)`, `checkout(): Promise<Order>`, `itemCount`. Todas las funciones siguen siendo `async`.
- `AuthContext`, el botón de Google y `lib/api.ts` (con `formatArs`, `apiFetch`) quedan como están. El backend .NET (`backend/`) no se toca.
- Claves de localStorage: carrito `maxi_cart_v1`, sucursal `maxi_sucursal_v1`. Si localStorage falla (incógnito estricto) o el JSON está corrupto: try/catch y degradar a estado en memoria — nunca romper.
- UI en español (es-AR). Precios con `formatArs`. Distancias formato `"4,2 km"` (coma decimal).
- Generador determinístico: misma entrada ⇒ mismo JSON byte a byte (RNG sembrado con COD).
- Tests de lógica pura con vitest; **imports relativos** (`../geo`), no alias `@/` (evita configurar resolución en vitest).
- `frontend/AGENTS.md` advierte que este Next.js difiere del conocimiento entrenado: ante dudas consultar `frontend/node_modules/next/dist/docs/`. Ya verificado para este plan: `useSearchParams` exige envolver el componente cliente en `<Suspense>` (`01-app/03-api-reference/04-functions/use-search-params.md`), y client components se prerenderizan en build ⇒ `window`/`navigator`/`localStorage` solo dentro de `useEffect`/handlers (`01-app/02-guides/static-exports.md`).
- Comandos npm se corren en `frontend/`. El generador se corre desde la raíz del repo.
- Excel fuente: `C:\Users\Yuneykar\Downloads\MAESTRO.xlsx` (hoja `MAESTRO`: 12.123 filas de datos; hoja `DESC X CANTIDAD`: 15.465 filas). Encabezados reales verificados: `COD, DESCRIPCIÓN, UXB, Medida, STOCK UNI/KGS, EAN 13, PROV, NOMBRE PROV, FAM, DEP, SECCIÓN, …, IVA %, Precio de Venta Salón C/IVA, Precio Oferta Salón C/IVA` y `COD, DESCRIPCIÓN, UXB, LLEVA, % DESC`. La columna de oferta trae el string `"#N/A"` cuando no hay oferta.
- Commits en estilo del repo: imperativo en inglés, sin prefijo convencional (ej. "Add design spec: …").

## Estructura de archivos

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `scripts/generate-products.py` | crear | Lee MAESTRO.xlsx → `products.json` (curado, validado, determinístico) |
| `frontend/lib/data/products.json` | generar y committear | ~200 productos `StaticProduct` |
| `frontend/lib/data/sucursales.ts` | crear | Las 8 sucursales reales con lat/lng |
| `frontend/lib/types.ts` | modificar | + `Sucursal`, `StaticProduct` |
| `frontend/lib/geo.ts` | crear | haversine, orden por distancia, formatKm |
| `frontend/lib/stock.ts` | crear | stockDe, validateCart, findNearestWithFullStock, mejorCobertura |
| `frontend/lib/cart.ts` | crear | operaciones puras del carrito |
| `frontend/lib/products.ts` | crear | JSON tipado + `PRODUCT_BY_ID` + `CATEGORIES` |
| `frontend/lib/__tests__/{geo,cart,stock}.test.ts` | crear | tests vitest de la lógica pura |
| `frontend/context/CartContext.tsx` | reescribir | localStorage, sin login, misma interfaz |
| `frontend/context/SucursalContext.tsx` | crear | sucursal activa + coords del usuario |
| `frontend/components/SucursalSelector.tsx` | crear | dropdown del top bar |
| `frontend/components/Header.tsx` | modificar | selector (Task 6); búsqueda + categorías reales (Task 8) |
| `frontend/components/ProductCard.tsx` | modificar | `StaticProduct`, badge de stock, sin gate de login |
| `frontend/components/ProductSections.tsx` | modificar | tipos `StaticProduct[]`, "Ver todo" → `/productos` |
| `frontend/components/CatalogoClient.tsx` | crear | catálogo con búsqueda + filtro por categoría |
| `frontend/app/page.tsx` | modificar | home desde `products.json`, sin fetch |
| `frontend/app/productos/page.tsx` | crear | página catálogo (Suspense + CatalogoClient) |
| `frontend/app/checkout/page.tsx` | reescribir | sin login, validación de stock, panel de redirección |
| `frontend/app/layout.tsx` | modificar | + `SucursalProvider` |
| `frontend/package.json` | modificar | + vitest, script `test` |

---

### Task 0: Rama de trabajo

- [ ] **Step 1: Crear rama y committear el plan**

```bash
cd c:/laragon/www/MaxiOfEcom
git checkout -b feature/static-sucursales
git add docs/superpowers/plans/2026-07-12-static-sucursales.md
git commit -m "Add implementation plan for static products and sucursales"
```

---

### Task 1: Tipos, sucursales y geo (con setup de vitest)

**Files:**
- Modify: `frontend/lib/types.ts`
- Create: `frontend/lib/data/sucursales.ts`
- Create: `frontend/lib/geo.ts`
- Test: `frontend/lib/__tests__/geo.test.ts`
- Modify: `frontend/package.json` (vitest + script `test`)

**Interfaces:**
- Consumes: `Product` existente en `lib/types.ts`.
- Produces (usado por tasks 2–9):
  - `interface Sucursal { id; nombre; direccion; telefono; horarios; lat; lng }`
  - `interface StaticProduct extends Omit<Product, "lastUnits" | "imageUrl"> { ean: string | null; stockBySucursal: Record<string, number> }`
  - `SUCURSALES: Sucursal[]` (Claypole primero — es el default).
  - `interface Coords { lat: number; lng: number }`
  - `interface SucursalConDistancia extends Sucursal { distanciaKm: number }`
  - `haversineKm(a: Coords, b: Coords): number`
  - `sucursalesPorDistancia(desde: Coords, sucursales?: Sucursal[]): SucursalConDistancia[]` (default `SUCURSALES`, orden ascendente)
  - `formatKm(km: number): string` → `"4,2 km"`

- [ ] **Step 1: Instalar vitest y agregar script**

```powershell
cd c:\laragon\www\MaxiOfEcom\frontend
npm install --save-dev vitest
```

En `frontend/package.json`, agregar a `"scripts"`:

```json
"test": "vitest run"
```

- [ ] **Step 2: Agregar tipos a `frontend/lib/types.ts`** (al final del archivo; `Product` no se toca)

```ts
export interface Sucursal {
  id: string;            // "claypole", "bernal", ...
  nombre: string;        // "Claypole"
  direccion: string;     // "Av. Lacaze 5948, Claypole"
  telefono: string;
  horarios: string;      // texto legible del sitio real
  lat: number;
  lng: number;
}

export interface StaticProduct extends Omit<Product, "lastUnits" | "imageUrl"> {
  ean: string | null;
  stockBySucursal: Record<string, number>; // clave = Sucursal.id
}
```

- [ ] **Step 3: Crear `frontend/lib/data/sucursales.ts`** (datos reales de maxiofertas.com.ar/sucursales, coordenadas aproximadas a precisión de barrio)

```ts
import type { Sucursal } from "../types";

// Datos reales de https://maxiofertas.com.ar/sucursales (jul 2026).
// Coordenadas aproximadas (precisión de barrio), suficientes para la demo.
// Claypole va primero: es la sucursal default cuando el usuario no eligió.
export const SUCURSALES: Sucursal[] = [
  {
    id: "claypole",
    nombre: "Claypole",
    direccion: "Av. Lacaze 5948, Claypole",
    telefono: "11-2257-7736",
    horarios: "Lun a Vie: 7 a 18:30 hs · Sáb: 7 a 16 hs · Dom y feriados: 7 a 15:30 hs",
    lat: -34.8025,
    lng: -58.3372,
  },
  {
    id: "villa-la-florida",
    nombre: "Villa La Florida",
    direccion: "Av. Monteverde 2246, Villa La Florida",
    telefono: "11-5314-3597",
    horarios: "Lun a Vie: 7 a 16:30 hs · Sáb: 7 a 16 hs · Dom y feriados: 7 a 12:30 hs",
    lat: -34.7861,
    lng: -58.3222,
  },
  {
    id: "santa-rosa",
    nombre: "Santa Rosa",
    direccion: "Av. Eva Perón 5743, Santa Rosa",
    telefono: "11-5058-3489",
    horarios: "Lun a Vie: 7 a 16:30 hs · Sáb: 7 a 16 hs · Dom y feriados: 7 a 12:30 hs",
    lat: -34.8232,
    lng: -58.2963,
  },
  {
    id: "solano",
    nombre: "San Fco. Solano",
    direccion: "Av. Monteverde 376, San Francisco Solano",
    telefono: "11-3313-9137",
    horarios: "Lun a Vie: 7 a 16:30 hs · Sáb: 7 a 16 hs · Dom y feriados: 7 a 12:30 hs",
    lat: -34.777,
    lng: -58.313,
  },
  {
    id: "quilmes-oeste",
    nombre: "Quilmes Oeste",
    direccion: "Felipe Amoedo 1998, Quilmes Oeste",
    telefono: "11-2287-7530",
    horarios: "Lun a Vie: 7 a 16:30 hs · Sáb: 7 a 16 hs · Dom y feriados: 7 a 12:30 hs",
    lat: -34.7376,
    lng: -58.2867,
  },
  {
    id: "dardo-rocha",
    nombre: "Dardo Rocha",
    direccion: "Dardo Rocha 1752, Bernal Oeste",
    telefono: "11-6604-8467",
    horarios: "Lun a Vie: 7 a 16:30 hs · Sáb: 7 a 16 hs · Dom y feriados: 7 a 12:30 hs",
    lat: -34.7247,
    lng: -58.305,
  },
  {
    id: "la-plata",
    nombre: "La Plata",
    direccion: "Av. 44 Nº 2574, La Plata",
    telefono: "11-5457-5418",
    horarios: "Lun a Vie: 7 a 16:30 hs · Sáb: 7 a 16 hs · Dom y feriados: 7 a 12:30 hs",
    lat: -34.9557,
    lng: -57.9645,
  },
  {
    id: "bernal",
    nombre: "Bernal",
    direccion: "Av. Los Quilmes 81, Bernal",
    telefono: "11-2376-9848",
    horarios: "Lun a Vie: 7 a 18 hs · Sáb: 7 a 16 hs · Dom y feriados: 8 a 14 hs",
    lat: -34.7095,
    lng: -58.286,
  },
];
```

- [ ] **Step 4: Escribir el test que falla — `frontend/lib/__tests__/geo.test.ts`**

```ts
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
```

- [ ] **Step 5: Correr el test y verificar que falla**

```powershell
cd c:\laragon\www\MaxiOfEcom\frontend
npm test
```
Esperado: FAIL — `Cannot find module '../geo'` (o similar).

- [ ] **Step 6: Implementar `frontend/lib/geo.ts`**

```ts
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
```

- [ ] **Step 7: Correr tests y verificar que pasan**

```powershell
npm test
```
Esperado: PASS (6 tests).

- [ ] **Step 8: Commit**

```bash
git add frontend/lib/types.ts frontend/lib/data/sucursales.ts frontend/lib/geo.ts frontend/lib/__tests__/geo.test.ts frontend/package.json frontend/package-lock.json
git commit -m "Add sucursal data, geo helpers and static product types"
```

---

### Task 2: Generador de productos + JSON + acceso tipado

**Files:**
- Create: `scripts/generate-products.py`
- Create (generado): `frontend/lib/data/products.json`
- Create: `frontend/lib/products.ts`

**Interfaces:**
- Consumes: `StaticProduct` (Task 1). Excel en `C:\Users\Yuneykar\Downloads\MAESTRO.xlsx`.
- Produces (usado por tasks 5, 7, 8, 9):
  - `products.json`: array de objetos con la forma exacta de `StaticProduct`, ordenado por `discountPercent` desc (empate: `name` asc).
  - `PRODUCTS: StaticProduct[]`, `PRODUCT_BY_ID: Map<string, StaticProduct>`, `CATEGORIES: string[]` desde `frontend/lib/products.ts`.
- El generador valida su salida y falla con `AssertionError` si algo no cierra (fail loudly, spec §Pruebas).

- [ ] **Step 1: Crear `scripts/generate-products.py`**

```python
"""Genera frontend/lib/data/products.json a partir de MAESTRO.xlsx.

Uso:
    python scripts/generate-products.py [ruta-a-MAESTRO.xlsx]

Requiere Python 3.10+ y openpyxl. La salida es deterministica:
mismo Excel -> mismo JSON byte a byte (RNG sembrado con el COD).
"""

import json
import random
import sys
import unicodedata
from pathlib import Path

import openpyxl

DEFAULT_XLSX = Path.home() / "Downloads" / "MAESTRO.xlsx"
OUT_PATH = Path(__file__).resolve().parents[1] / "frontend" / "lib" / "data" / "products.json"

TARGET = 200
STOCK_CAP = 500
FREE_SHIPPING_MIN = 40_000

# Mismo orden y primeros ids que frontend/lib/data/sucursales.ts
SUCURSAL_IDS = [
    "claypole", "villa-la-florida", "santa-rosa", "solano",
    "quilmes-oeste", "dardo-rocha", "la-plata", "bernal",
]

FAM_MAP = {
    1: "Almacén", 2: "Bebidas", 3: "Lácteos y Fiambres", 4: "Golosinas",
    5: "Perfumería", 6: "Congelados", 7: "Limpieza", 8: "Mascotas",
    9: "Hogar y Bazar", 11: "Juguetería", 12: "Electro",
}


def norm_header(value):
    """'Precio de Venta Salón C/IVA' -> 'PRECIO DE VENTA SALON C/IVA' (sin acentos)."""
    text = unicodedata.normalize("NFKD", str(value))
    return text.encode("ascii", "ignore").decode().strip().upper()


def as_number(value):
    return float(value) if isinstance(value, (int, float)) else None


def header_map(row):
    return {norm_header(v): i for i, v in enumerate(row) if v is not None}


def read_maestro(wb):
    ws = wb["MAESTRO"]
    rows = ws.iter_rows(values_only=True)
    cols = header_map(next(rows))
    out = []
    for row in rows:
        cod = row[cols["COD"]]
        desc = row[cols["DESCRIPCION"]]
        uxb = as_number(row[cols["UXB"]])
        stock = as_number(row[cols["STOCK UNI/KGS"]])
        venta = as_number(row[cols["PRECIO DE VENTA SALON C/IVA"]])
        oferta = as_number(row[cols["PRECIO OFERTA SALON C/IVA"]])  # "#N/A" -> None
        fam = row[cols["FAM"]]
        ean = row[cols["EAN 13"]]
        if cod is None or not desc or not str(desc).strip():
            continue
        if not stock or stock <= 0 or not venta or venta <= 0 or not uxb or uxb <= 0:
            continue
        if fam not in FAM_MAP:
            continue
        out.append({
            "cod": int(cod),
            "desc": str(desc).strip(),
            "uxb": int(uxb),
            "stock": int(stock),
            "venta": venta,
            "oferta": oferta if oferta is not None and 0 < oferta < venta else None,
            "fam": fam,
            "ean": str(int(ean)) if isinstance(ean, (int, float)) else None,
        })
    return out


def read_descuentos(wb):
    ws = wb["DESC X CANTIDAD"]
    rows = ws.iter_rows(values_only=True)
    cols = header_map(next(rows))
    by_cod = {}
    for row in rows:
        cod = row[cols["COD"]]
        lleva = as_number(row[cols["LLEVA"]])
        pct = as_number(row[cols["% DESC"]])
        if cod is None or lleva is None or pct is None:
            continue
        by_cod.setdefault(int(cod), []).append((int(lleva), pct))
    return by_cod


def select_products(rows):
    """Todas las ofertas validas + top stock por familia, proporcional, hasta TARGET."""
    offers = [r for r in rows if r["oferta"] is not None]
    assert len(offers) <= TARGET, f"hay {len(offers)} ofertas, mas que TARGET={TARGET}"
    pool = [r for r in rows if r["oferta"] is None]
    remaining = TARGET - len(offers)

    by_fam = {}
    for r in pool:
        by_fam.setdefault(r["fam"], []).append(r)
    total = len(pool)

    # Cuotas proporcionales al tamano de la familia (metodo del mayor resto).
    quotas, fractions, assigned = {}, [], 0
    for fam, items in sorted(by_fam.items()):
        exact = remaining * len(items) / total
        quotas[fam] = int(exact)
        assigned += int(exact)
        fractions.append((exact - int(exact), fam))
    for _, fam in sorted(fractions, reverse=True)[: remaining - assigned]:
        quotas[fam] += 1

    selected = list(offers)
    for fam, items in sorted(by_fam.items()):
        items.sort(key=lambda r: (-r["stock"], r["cod"]))
        selected.extend(items[: quotas[fam]])
    assert len(selected) == TARGET, f"esperaba {TARGET}, salieron {len(selected)}"
    return selected


def bulto_price(unit_price, uxb, descuentos):
    """Fila del mismo COD con mayor LLEVA <= UXB; sin entrada, sin descuento."""
    best = None
    for lleva, pct in descuentos or []:
        if lleva <= uxb and (best is None or lleva > best[0]):
            best = (lleva, pct)
    pct = best[1] if best else 0.0
    return round(unit_price * uxb * (1 - pct / 100))


def split_stock(cod, total):
    """Reparte `total` entre las 8 sucursales; 1-3 quedan en cero. Deterministico."""
    rng = random.Random(cod)
    zeros = set(rng.sample(SUCURSAL_IDS, rng.randint(1, 3)))
    active = [s for s in SUCURSAL_IDS if s not in zeros]
    weights = {s: rng.random() + 0.05 for s in active}
    weight_sum = sum(weights.values())
    result = {s: 0 for s in SUCURSAL_IDS}
    fractions = {}
    for s in active:
        exact = total * weights[s] / weight_sum
        result[s] = int(exact)
        fractions[s] = exact - int(exact)
    leftover = total - sum(result.values())
    for s in sorted(active, key=lambda s: -fractions[s])[:leftover]:
        result[s] += 1
    return result


def build_product(row, descuentos_by_cod):
    venta, oferta = row["venta"], row["oferta"]
    unit_price = round(oferta if oferta else venta)
    discount = round((1 - oferta / venta) * 100) if oferta else 0
    bulto = bulto_price(unit_price, row["uxb"], descuentos_by_cod.get(row["cod"]))
    capped = min(row["stock"], STOCK_CAP)
    return {
        "id": str(row["cod"]),
        "name": row["desc"],
        "category": FAM_MAP[row["fam"]],
        "discountPercent": discount,
        "unitPrice": unit_price,
        "unitPriceBeforeDiscount": round(venta) if oferta else None,
        "bultoPrice": bulto,
        "bultoQty": row["uxb"],
        "freeShipping": bulto >= FREE_SHIPPING_MIN,
        "ean": row["ean"],
        "stockBySucursal": split_stock(row["cod"], capped),
    }


def validate(products, rows_by_cod):
    assert len(products) == TARGET, f"{len(products)} productos, esperaba {TARGET}"
    assert len({p["id"] for p in products}) == TARGET, "ids duplicados"
    for p in products:
        assert p["unitPrice"] > 0 and p["bultoPrice"] > 0 and p["bultoQty"] >= 1, p["id"]
        if p["discountPercent"] > 0:
            assert p["unitPriceBeforeDiscount"] and p["unitPriceBeforeDiscount"] > p["unitPrice"], p["id"]
        else:
            assert p["unitPriceBeforeDiscount"] is None, p["id"]
        stocks = p["stockBySucursal"]
        assert set(stocks) == set(SUCURSAL_IDS), p["id"]
        capped = min(rows_by_cod[int(p["id"])]["stock"], STOCK_CAP)
        assert sum(stocks.values()) == capped, f"{p['id']}: suma {sum(stocks.values())} != {capped}"
        assert sum(1 for v in stocks.values() if v == 0) >= 1, f"{p['id']}: sin sucursal en cero"
        assert any(v > 0 for v in stocks.values()), f"{p['id']}: todo en cero"


def main():
    xlsx = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_XLSX
    wb = openpyxl.load_workbook(xlsx, read_only=True, data_only=True)
    rows = read_maestro(wb)
    descuentos = read_descuentos(wb)
    selected = select_products(rows)
    products = [build_product(r, descuentos) for r in selected]
    products.sort(key=lambda p: (-p["discountPercent"], p["name"]))
    validate(products, {r["cod"]: r for r in selected})
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8", newline="\n") as f:
        json.dump(products, f, ensure_ascii=False, indent=1)
        f.write("\n")
    con_oferta = sum(1 for p in products if p["discountPercent"] > 0)
    print(f"OK: {len(products)} productos ({con_oferta} con oferta) -> {OUT_PATH}")


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Correr el generador y verificar la salida**

```powershell
cd c:\laragon\www\MaxiOfEcom
python scripts/generate-products.py
```
Esperado: `OK: 200 productos (NN con oferta) -> ...products.json` (NN ≈ 70, según cuántas de las 73 ofertas caen en familias mapeadas). Si alguna aserción falla, el script corta con `AssertionError` — investigar antes de seguir.

- [ ] **Step 3: Verificar determinismo (dos corridas, mismo hash)**

```powershell
python scripts/generate-products.py; $h1 = (Get-FileHash frontend\lib\data\products.json).Hash
python scripts/generate-products.py; $h2 = (Get-FileHash frontend\lib\data\products.json).Hash
if ($h1 -eq $h2) { "DETERMINISTICO" } else { "ERROR: salidas distintas" }
```
Esperado: `DETERMINISTICO`.

- [ ] **Step 4: Crear `frontend/lib/products.ts`**

```ts
import productsJson from "./data/products.json";
import type { StaticProduct } from "./types";

export const PRODUCTS = productsJson as unknown as StaticProduct[];

export const PRODUCT_BY_ID = new Map(PRODUCTS.map((p) => [p.id, p]));

const CATEGORY_ORDER = [
  "Almacén", "Bebidas", "Lácteos y Fiambres", "Golosinas", "Perfumería",
  "Congelados", "Limpieza", "Mascotas", "Hogar y Bazar", "Juguetería", "Electro",
];

export const CATEGORIES = CATEGORY_ORDER.filter((c) =>
  PRODUCTS.some((p) => p.category === c)
);
```

- [ ] **Step 5: Verificar que compila**

```powershell
cd c:\laragon\www\MaxiOfEcom\frontend
npx tsc --noEmit
```
Esperado: sin errores.

- [ ] **Step 6: Commit**

```bash
git add scripts/generate-products.py frontend/lib/data/products.json frontend/lib/products.ts
git commit -m "Add product generator script and static catalog data"
```

---

### Task 3: Operaciones puras del carrito (`lib/cart.ts`)

**Files:**
- Create: `frontend/lib/cart.ts`
- Test: `frontend/lib/__tests__/cart.test.ts`

**Interfaces:**
- Consumes: `Cart`, `CartItem`, `PriceMode`, `StaticProduct` de `./types`.
- Produces (usado por CartContext en Task 5 y tests de Task 4):
  - `emptyCart(): Cart` → `{ id: "local", items: [], total: 0 }`
  - `addItem(cart: Cart, product: StaticProduct, mode: PriceMode, quantity: number): Cart` — `itemId = "${productId}:${mode}"`; si ya existe suma cantidades. `quantity` siempre en **unidades** (el caller pasa `bultoQty` para modo bulto). `unitPrice` del ítem: `unitPrice` del producto en modo unidad, `bultoPrice / bultoQty` en modo bulto.
  - `updateItemQuantity(cart: Cart, itemId: string, quantity: number): Cart` — `quantity <= 0` elimina el ítem.
  - `removeItem(cart: Cart, itemId: string): Cart`
  - Todas recalculan `subtotal` por ítem y `total`; nunca mutan el carrito recibido.

- [ ] **Step 1: Escribir el test que falla — `frontend/lib/__tests__/cart.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { addItem, emptyCart, removeItem, updateItemQuantity } from "../cart";
import type { StaticProduct } from "../types";

function producto(overrides: Partial<StaticProduct> = {}): StaticProduct {
  return {
    id: "1",
    name: "MANTECA S Y S X 200 GR",
    category: "Lácteos y Fiambres",
    discountPercent: 0,
    unitPrice: 2500,
    unitPriceBeforeDiscount: null,
    bultoPrice: 72000,
    bultoQty: 30,
    freeShipping: true,
    ean: null,
    stockBySucursal: { claypole: 10 },
    ...overrides,
  };
}

describe("emptyCart", () => {
  it("arranca vacío con total 0", () => {
    expect(emptyCart()).toEqual({ id: "local", items: [], total: 0 });
  });
});

describe("addItem", () => {
  it("agrega un ítem por unidad", () => {
    const cart = addItem(emptyCart(), producto(), "unidad", 1);
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]).toMatchObject({
      id: "1:unidad", productId: "1", productName: "MANTECA S Y S X 200 GR",
      mode: "unidad", quantity: 1, unitPrice: 2500, subtotal: 2500,
    });
    expect(cart.total).toBe(2500);
  });

  it("suma cantidades al repetir producto y modo", () => {
    let cart = addItem(emptyCart(), producto(), "unidad", 1);
    cart = addItem(cart, producto(), "unidad", 2);
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].quantity).toBe(3);
    expect(cart.total).toBe(7500);
  });

  it("modo bulto: cantidad en unidades, precio unitario = bultoPrice/bultoQty", () => {
    const cart = addItem(emptyCart(), producto(), "bulto", 30);
    expect(cart.items[0].unitPrice).toBe(2400);
    expect(cart.items[0].subtotal).toBe(72000);
    expect(cart.total).toBe(72000);
  });

  it("unidad y bulto del mismo producto son ítems separados", () => {
    let cart = addItem(emptyCart(), producto(), "unidad", 1);
    cart = addItem(cart, producto(), "bulto", 30);
    expect(cart.items.map((i) => i.id)).toEqual(["1:unidad", "1:bulto"]);
    expect(cart.total).toBe(74500);
  });

  it("no muta el carrito original", () => {
    const original = emptyCart();
    addItem(original, producto(), "unidad", 1);
    expect(original.items).toHaveLength(0);
  });
});

describe("updateItemQuantity", () => {
  it("actualiza cantidad y recalcula totales", () => {
    let cart = addItem(emptyCart(), producto(), "unidad", 1);
    cart = updateItemQuantity(cart, "1:unidad", 4);
    expect(cart.items[0].quantity).toBe(4);
    expect(cart.items[0].subtotal).toBe(10000);
    expect(cart.total).toBe(10000);
  });

  it("cantidad 0 elimina el ítem", () => {
    let cart = addItem(emptyCart(), producto(), "unidad", 2);
    cart = updateItemQuantity(cart, "1:unidad", 0);
    expect(cart.items).toHaveLength(0);
    expect(cart.total).toBe(0);
  });
});

describe("removeItem", () => {
  it("elimina el ítem y recalcula el total", () => {
    let cart = addItem(emptyCart(), producto(), "unidad", 1);
    cart = addItem(cart, producto({ id: "2", name: "OTRO", unitPrice: 1000 }), "unidad", 1);
    cart = removeItem(cart, "1:unidad");
    expect(cart.items.map((i) => i.id)).toEqual(["2:unidad"]);
    expect(cart.total).toBe(1000);
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

```powershell
npm test
```
Esperado: FAIL — `Cannot find module '../cart'`.

- [ ] **Step 3: Implementar `frontend/lib/cart.ts`**

```ts
import type { Cart, CartItem, PriceMode, StaticProduct } from "./types";

export function emptyCart(): Cart {
  return { id: "local", items: [], total: 0 };
}

function pricePerUnit(product: StaticProduct, mode: PriceMode): number {
  return mode === "bulto" ? product.bultoPrice / product.bultoQty : product.unitPrice;
}

function withTotals(items: CartItem[]): Cart {
  const recomputed = items.map((i) => ({ ...i, subtotal: i.unitPrice * i.quantity }));
  return {
    id: "local",
    items: recomputed,
    total: recomputed.reduce((sum, i) => sum + i.subtotal, 0),
  };
}

export function addItem(
  cart: Cart,
  product: StaticProduct,
  mode: PriceMode,
  quantity: number
): Cart {
  const itemId = `${product.id}:${mode}`;
  const existing = cart.items.find((i) => i.id === itemId);
  const items = existing
    ? cart.items.map((i) =>
        i.id === itemId ? { ...i, quantity: i.quantity + quantity } : i
      )
    : [
        ...cart.items,
        {
          id: itemId,
          productId: product.id,
          productName: product.name,
          mode,
          quantity,
          unitPrice: pricePerUnit(product, mode),
          subtotal: 0, // withTotals lo recalcula
        },
      ];
  return withTotals(items);
}

export function updateItemQuantity(cart: Cart, itemId: string, quantity: number): Cart {
  if (quantity <= 0) return removeItem(cart, itemId);
  return withTotals(cart.items.map((i) => (i.id === itemId ? { ...i, quantity } : i)));
}

export function removeItem(cart: Cart, itemId: string): Cart {
  return withTotals(cart.items.filter((i) => i.id !== itemId));
}
```

- [ ] **Step 4: Correr y verificar que pasa**

```powershell
npm test
```
Esperado: PASS (geo + cart).

- [ ] **Step 5: Commit**

```bash
git add frontend/lib/cart.ts frontend/lib/__tests__/cart.test.ts
git commit -m "Add pure cart operations"
```

---

### Task 4: Validación de stock y redirección (`lib/stock.ts`)

**Files:**
- Create: `frontend/lib/stock.ts`
- Test: `frontend/lib/__tests__/stock.test.ts`

**Interfaces:**
- Consumes: `CartItem`, `StaticProduct`, `Sucursal` de `./types`; `Coords`, `SucursalConDistancia`, `sucursalesPorDistancia` de `./geo`; en tests, `addItem`/`emptyCart` de `./cart` y `SUCURSALES`.
- Produces (usado por ProductCard Task 7 y checkout Task 9):
  - `stockDe(product: StaticProduct, sucursalId: string): number` — 0 si la clave no existe.
  - `interface Faltante { productId: string; nombre: string; pedido: number; disponible: number }`
  - `type ValidacionCarrito = { ok: true } | { ok: false; faltantes: Faltante[] }`
  - `validateCart(items: CartItem[], sucursalId: string, products: StaticProduct[]): ValidacionCarrito` — agrega cantidades de unidad+bulto del mismo producto; producto no encontrado ⇒ disponible 0.
  - `findNearestWithFullStock(items: CartItem[], sucursales: Sucursal[], desde: Coords, products: StaticProduct[]): SucursalConDistancia | null` — recorre por distancia; primera que valida ok; `null` si ninguna (la activa nunca gana porque no valida).
  - `mejorCobertura(items: CartItem[], sucursalesOrdenadas: Sucursal[], products: StaticProduct[]): { sucursal: Sucursal; faltantes: Faltante[] }` — menor cantidad de unidades faltantes; empate ⇒ la primera del array (el caller pasa la lista ya ordenada por distancia).

- [ ] **Step 1: Escribir el test que falla — `frontend/lib/__tests__/stock.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { addItem, emptyCart } from "../cart";
import { SUCURSALES } from "../data/sucursales";
import {
  findNearestWithFullStock, mejorCobertura, stockDe, validateCart,
} from "../stock";
import type { CartItem, StaticProduct } from "../types";

const CLAYPOLE = { lat: SUCURSALES[0].lat, lng: SUCURSALES[0].lng };

function stocks(parciales: Record<string, number>): Record<string, number> {
  const all: Record<string, number> = {};
  for (const s of SUCURSALES) all[s.id] = 0;
  return { ...all, ...parciales };
}

function producto(
  id: string,
  stockBySucursal: Record<string, number>,
  overrides: Partial<StaticProduct> = {}
): StaticProduct {
  return {
    id,
    name: `PRODUCTO ${id}`,
    category: "Almacén",
    discountPercent: 0,
    unitPrice: 100,
    unitPriceBeforeDiscount: null,
    bultoPrice: 1000,
    bultoQty: 10,
    freeShipping: false,
    ean: null,
    stockBySucursal,
    ...overrides,
  };
}

function itemsDe(...pares: Array<[StaticProduct, "unidad" | "bulto", number]>): CartItem[] {
  let cart = emptyCart();
  for (const [p, mode, qty] of pares) cart = addItem(cart, p, mode, qty);
  return cart.items;
}

describe("stockDe", () => {
  it("devuelve el stock de la sucursal y 0 si falta la clave", () => {
    const p = producto("1", stocks({ claypole: 7 }));
    expect(stockDe(p, "claypole")).toBe(7);
    expect(stockDe(p, "bernal")).toBe(0);
    expect(stockDe(p, "inexistente")).toBe(0);
  });
});

describe("validateCart", () => {
  it("ok cuando el stock alcanza para todo", () => {
    const p = producto("1", stocks({ claypole: 10 }));
    expect(validateCart(itemsDe([p, "unidad", 5]), "claypole", [p])).toEqual({ ok: true });
  });

  it("suma unidad + bulto del mismo producto contra el stock", () => {
    const p = producto("1", stocks({ claypole: 25 }));
    const items = itemsDe([p, "unidad", 1], [p, "bulto", 10], [p, "bulto", 20]);
    const res = validateCart(items, "claypole", [p]);
    expect(res).toEqual({
      ok: false,
      faltantes: [{ productId: "1", nombre: "PRODUCTO 1", pedido: 31, disponible: 25 }],
    });
  });

  it("producto que ya no existe en el catálogo cuenta como disponible 0", () => {
    const p = producto("999", stocks({ claypole: 10 }));
    const items = itemsDe([p, "unidad", 2]);
    const res = validateCart(items, "claypole", []);
    expect(res).toEqual({
      ok: false,
      faltantes: [{ productId: "999", nombre: "PRODUCTO 999", pedido: 2, disponible: 0 }],
    });
  });

  it("carrito vacío es ok", () => {
    expect(validateCart([], "claypole", [])).toEqual({ ok: true });
  });
});

describe("findNearestWithFullStock", () => {
  it("devuelve la más cercana que cubre todo el pedido", () => {
    // Solo Bernal cubre; Claypole (activa) y el resto no.
    const p = producto("1", stocks({ claypole: 2, bernal: 50 }));
    const items = itemsDe([p, "unidad", 24]);
    const res = findNearestWithFullStock(items, SUCURSALES, CLAYPOLE, [p]);
    expect(res?.id).toBe("bernal");
    expect(res?.distanciaKm).toBeGreaterThan(0);
  });

  it("null cuando ninguna sucursal cubre el pedido", () => {
    const p = producto("1", stocks({ claypole: 2, bernal: 3 }));
    const items = itemsDe([p, "unidad", 100]);
    expect(findNearestWithFullStock(items, SUCURSALES, CLAYPOLE, [p])).toBeNull();
  });
});

describe("mejorCobertura", () => {
  it("elige la sucursal con menos unidades faltantes", () => {
    const p = producto("1", stocks({ claypole: 2, bernal: 8 }));
    const items = itemsDe([p, "unidad", 10]);
    const res = mejorCobertura(items, SUCURSALES, [p]);
    expect(res.sucursal.id).toBe("bernal");
    expect(res.faltantes).toEqual([
      { productId: "1", nombre: "PRODUCTO 1", pedido: 10, disponible: 8 },
    ]);
  });

  it("en empate gana la primera del array (más cercana si viene ordenado)", () => {
    const p = producto("1", stocks({ claypole: 5, bernal: 5 }));
    const items = itemsDe([p, "unidad", 10]);
    const res = mejorCobertura(items, SUCURSALES, [p]);
    expect(res.sucursal.id).toBe("claypole");
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

```powershell
npm test
```
Esperado: FAIL — `Cannot find module '../stock'`.

- [ ] **Step 3: Implementar `frontend/lib/stock.ts`**

```ts
import type { CartItem, StaticProduct, Sucursal } from "./types";
import type { Coords, SucursalConDistancia } from "./geo";
import { sucursalesPorDistancia } from "./geo";

export function stockDe(product: StaticProduct, sucursalId: string): number {
  return product.stockBySucursal[sucursalId] ?? 0;
}

export interface Faltante {
  productId: string;
  nombre: string;
  pedido: number;
  disponible: number;
}

export type ValidacionCarrito = { ok: true } | { ok: false; faltantes: Faltante[] };

function pedidoPorProducto(items: CartItem[]): Map<string, { nombre: string; pedido: number }> {
  const map = new Map<string, { nombre: string; pedido: number }>();
  for (const item of items) {
    const prev = map.get(item.productId);
    map.set(item.productId, {
      nombre: item.productName,
      pedido: (prev?.pedido ?? 0) + item.quantity,
    });
  }
  return map;
}

export function validateCart(
  items: CartItem[],
  sucursalId: string,
  products: StaticProduct[]
): ValidacionCarrito {
  const byId = new Map(products.map((p) => [p.id, p]));
  const faltantes: Faltante[] = [];
  for (const [productId, { nombre, pedido }] of pedidoPorProducto(items)) {
    const product = byId.get(productId);
    const disponible = product ? stockDe(product, sucursalId) : 0;
    if (pedido > disponible) faltantes.push({ productId, nombre, pedido, disponible });
  }
  return faltantes.length === 0 ? { ok: true } : { ok: false, faltantes };
}

export function findNearestWithFullStock(
  items: CartItem[],
  sucursales: Sucursal[],
  desde: Coords,
  products: StaticProduct[]
): SucursalConDistancia | null {
  for (const sucursal of sucursalesPorDistancia(desde, sucursales)) {
    if (validateCart(items, sucursal.id, products).ok) return sucursal;
  }
  return null;
}

export function mejorCobertura(
  items: CartItem[],
  sucursalesOrdenadas: Sucursal[],
  products: StaticProduct[]
): { sucursal: Sucursal; faltantes: Faltante[] } {
  let best: { sucursal: Sucursal; faltantes: Faltante[]; unidades: number } | null = null;
  for (const sucursal of sucursalesOrdenadas) {
    const res = validateCart(items, sucursal.id, products);
    const faltantes = res.ok ? [] : res.faltantes;
    const unidades = faltantes.reduce((sum, f) => sum + (f.pedido - f.disponible), 0);
    if (!best || unidades < best.unidades) best = { sucursal, faltantes, unidades };
  }
  if (!best) throw new Error("mejorCobertura requiere al menos una sucursal");
  return { sucursal: best.sucursal, faltantes: best.faltantes };
}
```

- [ ] **Step 4: Correr y verificar que pasa**

```powershell
npm test
```
Esperado: PASS (geo + cart + stock, 3 archivos).

- [ ] **Step 5: Commit**

```bash
git add frontend/lib/stock.ts frontend/lib/__tests__/stock.test.ts
git commit -m "Add stock validation and nearest-sucursal logic"
```

---

### Task 5: Reescribir `CartContext` a localStorage sin login

**Files:**
- Modify (reescritura completa): `frontend/context/CartContext.tsx`

**Interfaces:**
- Consumes: `emptyCart`, `addItem`, `updateItemQuantity`, `removeItem` de `@/lib/cart`; `PRODUCT_BY_ID` de `@/lib/products`.
- Produces: **misma interfaz pública que hoy** (ver Global Constraints). `cart` nunca vuelve a ser `null` en la práctica (arranca `emptyCart()`), pero el tipo sigue siendo `Cart | null` para no tocar consumidores. Render inicial = carrito vacío; hidrata desde localStorage en `useEffect` (evita mismatch de hidratación). `loading` es `true` hasta hidratar.

- [ ] **Step 1: Reemplazar `frontend/context/CartContext.tsx` completo por:**

```tsx
"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import * as ops from "@/lib/cart";
import { PRODUCT_BY_ID } from "@/lib/products";
import type { Cart, Order, PriceMode } from "@/lib/types";

const CART_STORAGE_KEY = "maxi_cart_v1";

interface CartContextValue {
  cart: Cart | null;
  loading: boolean;
  addItem: (productId: string, mode: PriceMode, quantity: number) => Promise<void>;
  updateItemQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  checkout: () => Promise<Order>;
  itemCount: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

function loadCart(): Cart {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return ops.emptyCart();
    const parsed = JSON.parse(raw) as Cart;
    if (!Array.isArray(parsed.items) || typeof parsed.total !== "number") {
      return ops.emptyCart();
    }
    return parsed;
  } catch {
    // JSON corrupto o localStorage inaccesible: arrancar de cero
    return ops.emptyCart();
  }
}

function saveCart(cart: Cart) {
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch {
    // localStorage inaccesible (incógnito estricto): seguimos en memoria
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart>(ops.emptyCart());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setCart(loadCart());
    setLoading(false);
  }, []);

  const addItem = useCallback(
    async (productId: string, mode: PriceMode, quantity: number) => {
      const product = PRODUCT_BY_ID.get(productId);
      if (!product) throw new Error(`Producto desconocido: ${productId}`);
      const next = ops.addItem(cart, product, mode, quantity);
      setCart(next);
      saveCart(next);
    },
    [cart]
  );

  const updateItemQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      const next = ops.updateItemQuantity(cart, itemId, quantity);
      setCart(next);
      saveCart(next);
    },
    [cart]
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      const next = ops.removeItem(cart, itemId);
      setCart(next);
      saveCart(next);
    },
    [cart]
  );

  const checkout = useCallback(async (): Promise<Order> => {
    const order: Order = {
      id: `MX-${Date.now().toString(36).toUpperCase()}`,
      status: "Pending",
      createdAt: new Date().toISOString(),
      total: cart.total,
      items: cart.items,
    };
    const next = ops.emptyCart();
    setCart(next);
    saveCart(next);
    return order;
  }, [cart]);

  const itemCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ cart, loading, addItem, updateItemQuantity, removeItem, checkout, itemCount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de CartProvider");
  return ctx;
}
```

Notas: desaparecen `apiFetch` y `useAuth` — el carrito ya no depende del login. El stock **no** se descuenta al confirmar (demo con datos estáticos).

- [ ] **Step 2: Verificar tests y build**

```powershell
npm test
npm run build
```
Esperado: tests PASS; build OK (el home todavía fetchea la API y renderiza vacío — se arregla en Task 7).

- [ ] **Step 3: Commit**

```bash
git add frontend/context/CartContext.tsx
git commit -m "Rewrite CartContext to localStorage without login requirement"
```

---

### Task 6: `SucursalContext` + `SucursalSelector` en el Header

**Files:**
- Create: `frontend/context/SucursalContext.tsx`
- Create: `frontend/components/SucursalSelector.tsx`
- Modify: `frontend/app/layout.tsx` (envolver con `SucursalProvider`)
- Modify: `frontend/components/Header.tsx` (reemplazar el texto estático del top bar)

**Interfaces:**
- Consumes: `SUCURSALES`, `sucursalesPorDistancia`, `formatKm`, `Coords` (Task 1).
- Produces (usado por ProductCard Task 7 y checkout Task 9):
  - `useSucursal(): { sucursal: Sucursal; userCoords: Coords | null; hasChosen: boolean; locating: boolean; elegirSucursal(id: string): void; usarMiUbicacion(): void }`
  - Default sin elección previa: Claypole (`SUCURSALES[0]`) con `hasChosen = false`.
  - Persistencia en `maxi_sucursal_v1`: `{ sucursalId, userCoords, hasChosen }`.
  - GPS negado o no disponible: silencioso, queda el selector manual.

- [ ] **Step 1: Crear `frontend/context/SucursalContext.tsx`**

```tsx
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
```

- [ ] **Step 2: Crear `frontend/components/SucursalSelector.tsx`**

```tsx
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
```

- [ ] **Step 3: Envolver el layout — en `frontend/app/layout.tsx`**

Agregar import:

```tsx
import { SucursalProvider } from "@/context/SucursalContext";
```

y reemplazar

```tsx
          <AuthProvider>
            <CartProvider>{children}</CartProvider>
          </AuthProvider>
```

por

```tsx
          <AuthProvider>
            <SucursalProvider>
              <CartProvider>{children}</CartProvider>
            </SucursalProvider>
          </AuthProvider>
```

- [ ] **Step 4: Reemplazar el texto estático del Header**

En `frontend/components/Header.tsx`, agregar import:

```tsx
import { SucursalSelector } from "./SucursalSelector";
```

y reemplazar

```tsx
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span className="msym" style={{ fontSize: 16 }}>location_on</span>Elegí tu sucursal
            </span>
```

por

```tsx
            <SucursalSelector />
```

- [ ] **Step 5: Verificar build y comportamiento**

```powershell
npm run build
```
Esperado: build OK. Luego `npm run dev` y verificar a mano: el top bar muestra "Elegí tu sucursal" en amarillo; el dropdown lista las 8 con dirección; elegir una la persiste (recargar la página la mantiene); "Usar mi ubicación" con permiso concedido selecciona la más cercana y muestra distancias; con permiso negado no pasa nada visible.

- [ ] **Step 6: Commit**

```bash
git add frontend/context/SucursalContext.tsx frontend/components/SucursalSelector.tsx frontend/app/layout.tsx frontend/components/Header.tsx
git commit -m "Add SucursalContext and sucursal selector in header"
```

---

### Task 7: ProductCard con stock por sucursal + Home desde JSON

**Files:**
- Modify (reescritura completa): `frontend/components/ProductCard.tsx`
- Modify: `frontend/components/ProductSections.tsx` (tipos + links "Ver todo")
- Modify (reescritura completa): `frontend/app/page.tsx`

**Interfaces:**
- Consumes: `StaticProduct` (Task 1), `stockDe` (Task 4), `useSucursal` (Task 6), `useCart` (Task 5), `sucursalesPorDistancia`/`formatKm` (Task 1), `PRODUCTS` (Task 2).
- Produces: `ProductCard({ product }: { product: StaticProduct })`; `FeaturedProducts`/`OnFireShelf` aceptan `StaticProduct[]`.
- Reglas del badge (spec §4): stock ≥ 2×`bultoQty` ⇒ verde "Quedan {n} en {sucursal}"; 0 < stock < 2×`bultoQty` ⇒ naranja "Últimas {n} unidades en {sucursal}"; stock = 0 ⇒ gris "Sin stock en {sucursal} · hay en {másCercanaConStock} ({distancia})" y botón Agregar deshabilitado. El flag estático `lastUnits` desaparece. El gate de login (`window.alert`) se elimina.

- [ ] **Step 1: Reemplazar `frontend/components/ProductCard.tsx` completo por:**

```tsx
"use client";

import { useState } from "react";
import { formatArs } from "@/lib/api";
import type { PriceMode, StaticProduct } from "@/lib/types";
import { useCart } from "@/context/CartContext";
import { useSucursal } from "@/context/SucursalContext";
import { formatKm, sucursalesPorDistancia } from "@/lib/geo";
import { stockDe } from "@/lib/stock";

export function ProductCard({ product }: { product: StaticProduct }) {
  const [mode, setMode] = useState<PriceMode>("unidad");
  const { addItem } = useCart();
  const { sucursal, userCoords } = useSucursal();

  const isBulto = mode === "bulto";
  const bigPrice = isBulto ? product.bultoPrice : product.unitPrice;
  const subLabel = isBulto
    ? `Por unidad: ${formatArs(product.unitPrice)}`
    : `Bulto x${product.bultoQty}: ${formatArs(product.bultoPrice)}`;

  const stock = stockDe(product, sucursal.id);
  const sinStock = stock === 0;
  const pocasUnidades = stock > 0 && stock < 2 * product.bultoQty;

  const alternativa = sinStock
    ? sucursalesPorDistancia(userCoords ?? { lat: sucursal.lat, lng: sucursal.lng }).find(
        (s) => s.id !== sucursal.id && stockDe(product, s.id) > 0
      ) ?? null
    : null;

  const handleAdd = async () => {
    await addItem(product.id, mode, isBulto ? product.bultoQty : 1);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        background: "#fff",
        border: "1px solid #ececec",
        borderRadius: 10,
        overflow: "hidden",
        height: "100%",
      }}
    >
      <div
        style={{
          position: "relative",
          height: 148,
          background: "#f1f1f0",
          backgroundImage:
            "repeating-linear-gradient(45deg,#e8e8e5 0 11px,#f3f3f1 11px 22px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span className="font-mono" style={{ fontSize: 10, letterSpacing: ".06em", color: "#a2a29d", textTransform: "uppercase" }}>
          foto producto
        </span>
        {product.discountPercent > 0 && (
          <span
            className="font-condensed"
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              background: "#E63312",
              color: "#fff",
              fontWeight: 700,
              fontSize: 16,
              lineHeight: 1,
              padding: "3px 8px",
              borderRadius: 5,
            }}
          >
            -{product.discountPercent}%
          </span>
        )}
        {product.freeShipping && (
          <span
            style={{
              position: "absolute",
              bottom: 8,
              left: 8,
              background: "#2E7D32",
              color: "#fff",
              fontWeight: 700,
              fontSize: 9,
              letterSpacing: ".04em",
              padding: "4px 7px",
              borderRadius: 5,
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span className="msym" style={{ fontSize: 12 }}>local_shipping</span>
            Envío gratis
          </span>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 7, padding: 12, flex: 1 }}>
        <span style={{ fontWeight: 600, fontSize: 10, letterSpacing: ".07em", textTransform: "uppercase", color: "#E63312" }}>
          {product.category}
        </span>
        <span
          style={{
            fontWeight: 600,
            fontSize: 14.5,
            lineHeight: 1.25,
            color: "#1A1A1A",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: 36,
          }}
        >
          {product.name}
        </span>
        <div style={{ display: "flex", gap: 4, background: "#f4f4f2", borderRadius: 7, padding: 3 }}>
          <button
            onClick={() => setMode("unidad")}
            style={{
              flex: 1,
              border: "none",
              borderRadius: 5,
              padding: 5,
              fontWeight: 600,
              fontSize: 11,
              cursor: "pointer",
              background: isBulto ? "#fff" : "#1A1A1A",
              color: isBulto ? "#6a6a66" : "#fff",
            }}
          >
            Unidad
          </button>
          <button
            onClick={() => setMode("bulto")}
            style={{
              flex: 1,
              border: "none",
              borderRadius: 5,
              padding: 5,
              fontWeight: 600,
              fontSize: 11,
              cursor: "pointer",
              background: isBulto ? "#1A1A1A" : "#fff",
              color: isBulto ? "#fff" : "#6a6a66",
            }}
          >
            Bulto
          </button>
        </div>
        <div style={{ marginTop: "auto" }}>
          <div className="font-condensed" style={{ fontWeight: 700, fontSize: 30, lineHeight: 1, color: "#E63312" }}>
            {formatArs(bigPrice)}
          </div>
          <div style={{ fontSize: 11.5, color: "#8a8a86", marginTop: 3 }}>{subLabel}</div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: 11,
            fontWeight: 600,
            color: sinStock ? "#8a8a86" : pocasUnidades ? "#F57C00" : "#2E7D32",
          }}
        >
          <span className="msym" style={{ fontSize: 14 }}>
            {sinStock ? "block" : "inventory_2"}
          </span>
          <span>
            {sinStock ? (
              <>
                Sin stock en {sucursal.nombre}
                {alternativa && (
                  <> · hay en {alternativa.nombre} ({formatKm(alternativa.distanciaKm)})</>
                )}
              </>
            ) : pocasUnidades ? (
              <>Últimas {stock} unidades en {sucursal.nombre}</>
            ) : (
              <>Quedan {stock} en {sucursal.nombre}</>
            )}
          </span>
        </div>
        <button
          onClick={handleAdd}
          disabled={sinStock}
          style={{
            marginTop: 4,
            background: sinStock ? "#c9c9c4" : "#E63312",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: 11,
            fontWeight: 700,
            fontSize: 12.5,
            textTransform: "uppercase",
            letterSpacing: ".03em",
            cursor: sinStock ? "default" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <span className="msym" style={{ fontSize: 17 }}>add_shopping_cart</span>
          Agregar
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Actualizar `frontend/components/ProductSections.tsx`**

Reemplazar el archivo completo por:

```tsx
import Link from "next/link";
import type { StaticProduct } from "@/lib/types";
import { ProductCard } from "./ProductCard";

export function FeaturedProducts({ products }: { products: StaticProduct[] }) {
  return (
    <section style={{ marginBottom: 30 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 className="font-condensed" style={{ fontWeight: 800, textTransform: "uppercase", fontSize: 27, margin: 0 }}>
          Productos destacados
        </h2>
        <Link href="/productos" style={{ color: "#E63312", fontWeight: 800, fontSize: 13.5 }}>
          Ver todo →
        </Link>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

export function OnFireShelf({ products }: { products: StaticProduct[] }) {
  return (
    <section style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h2 className="font-condensed" style={{ fontWeight: 800, textTransform: "uppercase", fontSize: 27, margin: 0 }}>
          Ofertas on fire 🔥
        </h2>
        <Link href="/productos?ofertas=1" style={{ color: "#E63312", fontWeight: 800, fontSize: 13.5 }}>
          Ver todo →
        </Link>
      </div>
      <div className="shelf" style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8 }}>
        {products.map((p) => (
          <div key={p.id} style={{ flex: "0 0 214px" }}>
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Reemplazar `frontend/app/page.tsx` completo por:**

```tsx
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
```

- [ ] **Step 4: Verificar build y comportamiento**

```powershell
npm run build
```
Esperado: build OK. Con `npm run dev`: el home muestra 8 destacados + 12 on fire con productos reales del Excel; cada tarjeta muestra el badge de stock de la sucursal activa; cambiar la sucursal en el header actualiza los badges; un producto sin stock en la activa muestra "Sin stock en X · hay en Y (n,n km)" con el botón gris deshabilitado; agregar al carrito funciona **sin login** y el contador del header sube.

- [ ] **Step 5: Commit**

```bash
git add frontend/components/ProductCard.tsx frontend/components/ProductSections.tsx frontend/app/page.tsx
git commit -m "Show per-sucursal stock on product cards and load home from static data"
```

---

### Task 8: Catálogo `/productos` + búsqueda y categorías del Header

**Files:**
- Create: `frontend/app/productos/page.tsx`
- Create: `frontend/components/CatalogoClient.tsx`
- Modify: `frontend/components/Header.tsx` (búsqueda funcional + categorías reales)

**Interfaces:**
- Consumes: `PRODUCTS`, `CATEGORIES` (Task 2), `ProductCard` (Task 7).
- Produces: ruta `/productos` con query params `q` (texto), `cat` (categoría exacta), `ofertas=1` (solo descuento > 0).
- Regla Next 16 (docs locales): el componente que usa `useSearchParams` va envuelto en `<Suspense>`; la página en sí queda como server component.

- [ ] **Step 1: Crear `frontend/components/CatalogoClient.tsx`**

```tsx
"use client";

import { useMemo, type CSSProperties } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CATEGORIES, PRODUCTS } from "@/lib/products";
import { ProductCard } from "./ProductCard";

function normalizar(text: string): string {
  // NFD separa los acentos como diacríticos combinantes (U+0300–U+036F) y los borra
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function CatalogoClient() {
  const router = useRouter();
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const cat = params.get("cat");
  const soloOfertas = params.get("ofertas") === "1";

  const filtered = useMemo(() => {
    const nq = normalizar(q.trim());
    return PRODUCTS.filter((p) => {
      if (cat && p.category !== cat) return false;
      if (soloOfertas && p.discountPercent === 0) return false;
      if (nq && !normalizar(p.name).includes(nq)) return false;
      return true;
    });
  }, [q, cat, soloOfertas]);

  const irA = (nuevaCat: string | null, ofertas = false) => {
    const next = new URLSearchParams();
    if (q.trim()) next.set("q", q.trim());
    if (nuevaCat) next.set("cat", nuevaCat);
    if (ofertas) next.set("ofertas", "1");
    const qs = next.toString();
    router.replace(qs ? `/productos?${qs}` : "/productos");
  };

  const chipStyle = (active: boolean): CSSProperties => ({
    border: "1px solid " + (active ? "#E63312" : "#ddd8cd"),
    background: active ? "#E63312" : "#fff",
    color: active ? "#fff" : "#1A1A1A",
    borderRadius: 20,
    padding: "7px 14px",
    fontWeight: 600,
    fontSize: 12.5,
    cursor: "pointer",
    whiteSpace: "nowrap",
  });

  return (
    <>
      <h1 className="font-condensed" style={{ fontWeight: 800, textTransform: "uppercase", fontSize: 32, margin: "0 0 18px" }}>
        Catálogo
      </h1>

      <div className="shelf" style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 10, marginBottom: 8 }}>
        <button style={chipStyle(!cat && !soloOfertas)} onClick={() => irA(null)}>
          Todas
        </button>
        {CATEGORIES.map((c) => (
          <button key={c} style={chipStyle(cat === c)} onClick={() => irA(c)}>
            {c}
          </button>
        ))}
        <button style={chipStyle(soloOfertas)} onClick={() => irA(null, true)}>
          🔥 Ofertas
        </button>
      </div>

      <p style={{ fontSize: 13, color: "#8a8a86", margin: "0 0 16px" }}>
        {filtered.length} producto{filtered.length === 1 ? "" : "s"}
        {q.trim() && <> para «{q.trim()}»</>}
        {cat && <> en {cat}</>}
      </p>

      {filtered.length === 0 ? (
        <p style={{ fontSize: 14, color: "#6b6459" }}>
          No encontramos productos con esos filtros. Probá con otra búsqueda.
        </p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: Crear `frontend/app/productos/page.tsx`**

```tsx
import { Suspense } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CatalogoClient } from "@/components/CatalogoClient";

export default function ProductosPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />
      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "30px 22px 60px", flex: 1, width: "100%" }}>
        {/* useSearchParams exige Suspense en prerender estático (docs Next 16) */}
        <Suspense fallback={null}>
          <CatalogoClient />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 3: Conectar búsqueda y categorías en `frontend/components/Header.tsx`**

3a. Actualizar imports — agregar:

```tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/products";
```

3b. Dentro de `export function Header() {`, agregar al inicio:

```tsx
  const router = useRouter();
  const [query, setQuery] = useState("");
```

3c. Eliminar la línea del módulo:

```tsx
const categories = ["Almacén", "Bebidas", "Lácteos", "Frescos", "Limpieza", "Perfumería", "Bebés", "Mascotas"];
```

3d. Reemplazar el bloque del buscador (el `<div>` con el `<input placeholder="Buscar productos, marcas y más…">` y el botón `search`) por un `<form>`:

```tsx
          <form
            onSubmit={(e) => {
              e.preventDefault();
              router.push(`/productos?q=${encodeURIComponent(query.trim())}`);
            }}
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
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar productos, marcas y más…"
              style={{ flex: 1, border: "none", padding: "12px 16px", fontSize: 14, outline: "none", minWidth: 0 }}
            />
            <button
              type="submit"
              style={{ background: "#F7941D", color: "#fff", border: "none", padding: "0 20px", cursor: "pointer", display: "flex", alignItems: "center" }}
            >
              <span className="msym" style={{ fontSize: 24 }}>search</span>
            </button>
          </form>
```

3e. Convertir el botón "Categorías" en link al catálogo — reemplazar el `<button>` que contiene `<span className="msym" ...>menu</span>Categorías` por:

```tsx
          <Link
            href="/productos"
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
              flex: "0 0 auto",
            }}
          >
            <span className="msym" style={{ fontSize: 21 }}>menu</span>Categorías
          </Link>
```

3f. Reemplazar la fila de categorías (el `{categories.map((cat) => (...))}` y el `<div>` de "Ofertas") por:

```tsx
            {CATEGORIES.map((cat) => (
              <Link
                key={cat}
                href={`/productos?cat=${encodeURIComponent(cat)}`}
                style={{ color: "#fff", fontWeight: 600, fontSize: 13, padding: "10px 14px", whiteSpace: "nowrap" }}
              >
                {cat}
              </Link>
            ))}
            <Link
              href="/productos?ofertas=1"
              style={{
                color: "#FFD23F",
                fontWeight: 800,
                fontSize: 13,
                padding: "10px 14px",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <span className="msym" style={{ fontSize: 17 }}>sell</span>Ofertas
            </Link>
```

- [ ] **Step 4: Verificar build y comportamiento**

```powershell
npm run build
```
Esperado: build OK, aparece la ruta `/productos` en el resumen. Con `npm run dev`: `/productos` muestra los 200 con chips de categorías reales; buscar "manteca" desde el header navega a `/productos?q=manteca` y filtra (insensible a acentos/mayúsculas); las categorías del header filtran; "Ofertas" muestra solo productos con descuento; sin resultados muestra el mensaje vacío.

- [ ] **Step 5: Commit**

```bash
git add frontend/app/productos/page.tsx frontend/components/CatalogoClient.tsx frontend/components/Header.tsx
git commit -m "Add product catalog page with search and category filters"
```

---

### Task 9: Checkout con validación de stock y redirección

**Files:**
- Modify (reescritura completa): `frontend/app/checkout/page.tsx`

**Interfaces:**
- Consumes: `useCart` (Task 5), `useSucursal` (Task 6), `validateCart`/`findNearestWithFullStock`/`mejorCobertura` (Task 4), `sucursalesPorDistancia`/`formatKm` (Task 1), `PRODUCTS` (Task 2), `SUCURSALES` (Task 1).
- Comportamiento (spec §3):
  1. Bloque "Retirás en: {sucursal} — {dirección}" con "cambiar" (despliega un `<select>` con las 8).
  2. `validateCart` corre en cada cambio de carrito/sucursal (useMemo).
  3. Falta stock ⇒ panel de redirección **en lugar** del botón de confirmar: detalle por producto ("pediste N, hay M"); si `findNearestWithFullStock` encuentra ⇒ "**{Sucursal}** (a {distancia}) tiene todo tu pedido" + botones [Retirar en {Sucursal}] (cambia sucursal activa, revalida solo) y [Ajustar cantidades] (scroll a los ítems); si ninguna ⇒ mensaje con `mejorCobertura` + [Ajustar cantidades]. Nunca bloquea sin salida.
  4. Stock OK ⇒ "Confirmar compra" genera pedido local `MX-…`, muestra confirmación con sucursal de retiro y vacía el carrito. Sin descuento de stock.
  - `desde` = coords del usuario si hay GPS; si no, coords de la sucursal activa.
  - Sin gates de `isAuthenticated`.

- [ ] **Step 1: Reemplazar `frontend/app/checkout/page.tsx` completo por:**

```tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import { useSucursal } from "@/context/SucursalContext";
import { formatArs } from "@/lib/api";
import { SUCURSALES } from "@/lib/data/sucursales";
import { formatKm, sucursalesPorDistancia } from "@/lib/geo";
import { PRODUCTS } from "@/lib/products";
import { findNearestWithFullStock, mejorCobertura, validateCart } from "@/lib/stock";

export default function CheckoutPage() {
  const { cart, loading, updateItemQuantity, removeItem, checkout } = useCart();
  const { sucursal, userCoords, elegirSucursal } = useSucursal();
  const router = useRouter();
  const [placing, setPlacing] = useState(false);
  const [confirmado, setConfirmado] = useState<{
    orderId: string;
    sucursalNombre: string;
    direccion: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cambiandoSucursal, setCambiandoSucursal] = useState(false);

  const items = cart?.items ?? [];
  const total = cart?.total ?? 0;

  const desde = useMemo(
    () => userCoords ?? { lat: sucursal.lat, lng: sucursal.lng },
    [userCoords, sucursal]
  );
  const validacion = useMemo(
    () => validateCart(items, sucursal.id, PRODUCTS),
    [items, sucursal.id]
  );
  const alternativa = useMemo(
    () => (validacion.ok ? null : findNearestWithFullStock(items, SUCURSALES, desde, PRODUCTS)),
    [validacion, items, desde]
  );
  const cobertura = useMemo(
    () =>
      validacion.ok || alternativa
        ? null
        : mejorCobertura(items, sucursalesPorDistancia(desde), PRODUCTS),
    [validacion, alternativa, items, desde]
  );

  const handleCheckout = async () => {
    setPlacing(true);
    setError(null);
    try {
      const order = await checkout();
      setConfirmado({
        orderId: order.id,
        sucursalNombre: sucursal.nombre,
        direccion: sucursal.direccion,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo completar la compra.");
    } finally {
      setPlacing(false);
    }
  };

  const ajustarCantidades = () => {
    document.getElementById("cart-items")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "40px 22px 60px", flex: 1, width: "100%" }}>
        <h1 className="font-condensed" style={{ fontWeight: 800, textTransform: "uppercase", fontSize: 32, marginBottom: 24 }}>
          Tu pedido
        </h1>

        {loading && <p style={{ fontSize: 14, color: "#6b6459" }}>Cargando tu carrito…</p>}

        {!loading && confirmado && (
          <div style={{ background: "#12A050", color: "#fff", padding: 20, borderRadius: 12, marginBottom: 20 }}>
            ¡Pedido confirmado! Número de pedido: <b>{confirmado.orderId}</b>
            <div style={{ marginTop: 6, fontSize: 13.5 }}>
              Retirás en <b>{confirmado.sucursalNombre}</b> — {confirmado.direccion}
            </div>
            <div style={{ marginTop: 12 }}>
              <button
                onClick={() => router.push("/")}
                style={{ background: "#fff", color: "#12A050", border: "none", borderRadius: 8, padding: "10px 16px", fontWeight: 700, cursor: "pointer" }}
              >
                Volver al inicio
              </button>
            </div>
          </div>
        )}

        {!loading && !confirmado && items.length === 0 && (
          <p style={{ fontSize: 14, color: "#6b6459" }}>
            Tu carrito está vacío.{" "}
            <a href="#" onClick={(e) => { e.preventDefault(); router.push("/productos"); }} style={{ color: "#E63312", fontWeight: 700 }}>
              Ver el catálogo
            </a>
          </p>
        )}

        {!loading && !confirmado && items.length > 0 && (
          <>
            <div
              style={{
                background: "#fff",
                border: "1px solid #ececec",
                borderRadius: 12,
                padding: 14,
                marginBottom: 20,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em", color: "#8a8a86", fontWeight: 700 }}>
                  Retirás en
                </div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>
                  {sucursal.nombre} — <span style={{ fontWeight: 500 }}>{sucursal.direccion}</span>
                </div>
              </div>
              {cambiandoSucursal ? (
                <select
                  value={sucursal.id}
                  onChange={(e) => {
                    elegirSucursal(e.target.value);
                    setCambiandoSucursal(false);
                  }}
                  style={{ padding: 8, borderRadius: 8, border: "1px solid #ddd8cd", fontSize: 13 }}
                >
                  {SUCURSALES.map((s) => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              ) : (
                <button
                  onClick={() => setCambiandoSucursal(true)}
                  style={{ background: "none", border: "none", color: "#E63312", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                >
                  cambiar
                </button>
              )}
            </div>

            <div id="cart-items" style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
              {items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    background: "#fff",
                    border: "1px solid #ececec",
                    borderRadius: 12,
                    padding: 14,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{item.productName}</div>
                    <div style={{ fontSize: 12, color: "#8a8a86" }}>
                      {item.mode === "bulto" ? "Bulto" : "Unidad"} · {formatArs(item.unitPrice)} c/u
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <input
                      type="number"
                      min={0}
                      value={item.quantity}
                      onChange={(e) => updateItemQuantity(item.id, Number(e.target.value))}
                      style={{ width: 56, padding: 6, border: "1px solid #ddd8cd", borderRadius: 6 }}
                    />
                    <div className="font-condensed" style={{ fontWeight: 700, fontSize: 18, minWidth: 90, textAlign: "right" }}>
                      {formatArs(item.subtotal)}
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      style={{ background: "none", border: "none", color: "#E63312", cursor: "pointer" }}
                      title="Quitar"
                    >
                      <span className="msym" style={{ fontSize: 20 }}>delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <span className="font-condensed" style={{ fontWeight: 700, fontSize: 22, textTransform: "uppercase" }}>
                Total
              </span>
              <span className="font-condensed" style={{ fontWeight: 800, fontSize: 30, color: "#E63312" }}>
                {formatArs(total)}
              </span>
            </div>

            {error && <p style={{ color: "#E63312", fontSize: 13, marginBottom: 12 }}>{error}</p>}

            {!validacion.ok ? (
              <div style={{ background: "#FFF4E5", border: "1px solid #F57C00", borderRadius: 12, padding: 16 }}>
                <div style={{ fontWeight: 800, marginBottom: 8, color: "#B25000", display: "flex", alignItems: "center", gap: 6 }}>
                  <span className="msym" style={{ fontSize: 18 }}>warning</span>
                  {sucursal.nombre} no tiene stock suficiente para tu pedido
                </div>
                <ul style={{ margin: "0 0 12px", paddingLeft: 18, fontSize: 13, color: "#6b4a1f" }}>
                  {validacion.faltantes.map((f) => (
                    <li key={f.productId}>
                      {f.nombre}: pediste {f.pedido}, hay {f.disponible}
                    </li>
                  ))}
                </ul>

                {alternativa && (
                  <>
                    <p style={{ fontSize: 13.5, margin: "0 0 10px" }}>
                      <b>{alternativa.nombre}</b> (a {formatKm(alternativa.distanciaKm)}) tiene todo tu pedido.
                    </p>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button
                        onClick={() => elegirSucursal(alternativa.id)}
                        style={{ background: "#E63312", color: "#fff", border: "none", borderRadius: 8, padding: "11px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                      >
                        Retirar en {alternativa.nombre}
                      </button>
                      <button
                        onClick={ajustarCantidades}
                        style={{ background: "#fff", color: "#1A1A1A", border: "1px solid #ddd8cd", borderRadius: 8, padding: "11px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                      >
                        Ajustar cantidades
                      </button>
                    </div>
                  </>
                )}

                {!alternativa && cobertura && (
                  <>
                    <p style={{ fontSize: 13.5, margin: "0 0 10px" }}>
                      Ninguna sucursal cubre todo el pedido. La que más se acerca es{" "}
                      <b>{cobertura.sucursal.nombre}</b>
                      {cobertura.faltantes.map(
                        (f) => ` · le faltan ${f.pedido - f.disponible} unidades de ${f.nombre}`
                      )}
                      .
                    </p>
                    <button
                      onClick={ajustarCantidades}
                      style={{ background: "#fff", color: "#1A1A1A", border: "1px solid #ddd8cd", borderRadius: 8, padding: "11px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                    >
                      Ajustar cantidades
                    </button>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={handleCheckout}
                disabled={placing}
                style={{
                  width: "100%",
                  background: "#E63312",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: 14,
                  fontWeight: 800,
                  fontSize: 14,
                  textTransform: "uppercase",
                  cursor: placing ? "default" : "pointer",
                  opacity: placing ? 0.7 : 1,
                }}
              >
                {placing ? "Confirmando…" : "Confirmar compra"}
              </button>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 2: Verificar build y flujo completo a mano**

```powershell
npm run build
```
Esperado: build OK. Con `npm run dev`, flujo del spec (§Pruebas):
1. Elegir sucursal en el header.
2. Agregar de un producto **más unidades que su stock** en esa sucursal (mirar el badge; ej. agregar varios bultos).
3. Ir a `/checkout`: aparece el panel naranja con el detalle "pediste N, hay M" y la sugerencia "**X** (a n,n km) tiene todo tu pedido".
4. Botón [Retirar en X]: cambia la sucursal (se ve en el bloque "Retirás en") y el panel desaparece; aparece "Confirmar compra".
5. Confirmar: panel verde con `MX-…` y la sucursal de retiro; el carrito queda vacío (contador del header en 0).
6. Caso sin cobertura total (pedir más que el stock de todas): mensaje "Ninguna sucursal cubre…" con [Ajustar cantidades]; bajar la cantidad desde el input revalida al instante.

- [ ] **Step 3: Commit**

```bash
git add frontend/app/checkout/page.tsx
git commit -m "Rewrite checkout with stock validation and sucursal redirect"
```

---

### Task 10: Verificación integral

**Files:** ninguno nuevo — solo verificación.

- [ ] **Step 1: Suite completa**

```powershell
cd c:\laragon\www\MaxiOfEcom\frontend
npm test
npm run lint
npm run build
```
Esperado: tests PASS, lint sin errores, build OK con rutas `/`, `/checkout`, `/productos`.

- [ ] **Step 2: Build como GitHub Pages (basePath)**

```powershell
$env:GITHUB_PAGES = "true"
npm run build
Remove-Item Env:GITHUB_PAGES
```
Esperado: build OK (verifica que nada rompa con basePath `/maxi-ofertas-ecommerce`).

- [ ] **Step 3: Regenerar y verificar que el JSON committeado está al día**

```powershell
cd c:\laragon\www\MaxiOfEcom
python scripts/generate-products.py
git status --short frontend/lib/data/products.json
```
Esperado: sin cambios (working tree limpio para ese archivo).

- [ ] **Step 4: Chequeo manual final** (con `npm run dev`): pasada rápida del flujo completo del spec — elegir sucursal → agregar más que el stock → ver redirección → confirmar — más búsqueda y filtros del catálogo.

---

## Notas para el ejecutor

- Si `npm test` falla por resolución de módulos TS, revisar que los tests usen **imports relativos** (no `@/`).
- Si el build falla con "useSearchParams() should be wrapped in a suspense boundary": el `<Suspense>` de `app/productos/page.tsx` falta o quedó dentro del componente equivocado.
- Si el generador tira `AssertionError`, el mensaje dice qué producto/regla falló — no parchear la aserción: investigar el dato del Excel.
- `products.json` se committea; regenerarlo solo cuando cambie el Excel (`python scripts/generate-products.py`).
- Al terminar: usar superpowers:finishing-a-development-branch (rama `feature/static-sucursales`).
