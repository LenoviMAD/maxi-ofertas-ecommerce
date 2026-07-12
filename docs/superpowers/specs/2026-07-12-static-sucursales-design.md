# Modo estático: productos del MAESTRO, sucursales y compra por cercanía

**Fecha:** 2026-07-12
**Estado:** Aprobado por Moises (diseño validado sección por sección)

## Contexto

El front (Next.js 16, `output: "export"`, deploy en GitHub Pages) hoy depende del
backend .NET (`/api/products`, `/api/cart`) y de login con Google para todo el flujo
de compra. No hay cadena de conexión disponible, así que el sitio se ve vacío.

Objetivo: que el front funcione completo con **datos estáticos** — productos reales
del Excel `MAESTRO.xlsx`, las 8 sucursales reales de maxiofertas.com.ar, stock por
sucursal inventado pero derivado del stock real, y lógica de compra por cercanía
con redirección cuando la sucursal más cercana no cubre el pedido.

Restricción clave: `output: "export"` significa que **no hay servidor** — todos los
datos se resuelven en build (JSON importado) y toda la lógica corre en el navegador.

## Decisiones tomadas (con el usuario)

| Decisión | Elección |
|---|---|
| Tamaño del catálogo | ~200 productos curados del Excel (de 3.690 usables) |
| Carrito | localStorage, **sin login** (el login Google queda, pero no es requisito) |
| Ubicación del cliente | GPS del navegador + selector manual como fallback |
| Redirección por stock | Se valida **todo el carrito junto** en el checkout; se sugiere la sucursal más cercana que cubra el pedido completo |
| Extras de sucursales | Stock visible por sucursal en cada ProductCard (sin página de sucursales ni mapa por ahora) |
| Catálogo | Sí: página `/productos` con búsqueda y filtro por categoría |
| Arquitectura | Script generador committeado + contextos locales (no mock de API, no datos inline) |

## Arquitectura

```
scripts/
  generate-products.py      # lee MAESTRO.xlsx → frontend/lib/data/products.json
frontend/
  lib/
    data/
      products.json         # ~200 productos generados (committeado)
      sucursales.ts         # 8 sucursales a mano, con lat/lng
    geo.ts                  # haversine, ordenar sucursales por distancia
    stock.ts                # validateCart, findNearestWithFullStock (lógica pura)
    cart.ts                 # operaciones puras del carrito (add/update/remove/total)
    types.ts                # se extiende: Sucursal, stockBySucursal, etc.
  context/
    CartContext.tsx         # reescrito: localStorage, sin login, misma interfaz pública
    SucursalContext.tsx     # nuevo: sucursal activa + coords del usuario
  components/
    SucursalSelector.tsx    # nuevo: dropdown en el top bar del Header
    ProductCard.tsx         # badge de stock por sucursal activa
  app/
    page.tsx                # home desde products.json (sin fetch)
    productos/page.tsx      # nuevo: catálogo con búsqueda + categorías
    checkout/page.tsx       # sin login, validación de stock + panel de redirección
```

El backend .NET no se toca. `lib/api.ts` conserva `formatArs` y helpers; las llamadas
`apiFetch` desaparecen de los flujos de producto/carrito.

## Sección 1 — Datos estáticos

### Generador `scripts/generate-products.py`

Python + openpyxl (re-ejecutable cuando cambie el Excel). Lee la hoja `MAESTRO`
(12.123 filas) y:

1. **Filtra usables:** stock > 0, `Precio de Venta Salón C/IVA` > 0, UXB > 0,
   descripción no vacía. (Hoy: 3.690 filas.)
2. **Selecciona ~200:** todos los que tienen precio de oferta válido
   (`Precio Oferta Salón C/IVA` numérico y menor al de venta — hoy 73) + los de
   mayor stock por familia, proporcional al tamaño de la familia, hasta llegar a 200.
3. **Mapea FAM → categoría legible:**
   1 Almacén · 2 Bebidas · 3 Lácteos y Fiambres · 4 Golosinas · 5 Perfumería ·
   6 Congelados · 7 Limpieza · 8 Mascotas · 9 Hogar y Bazar · 11 Juguetería ·
   12 Electro. (Familias menores 10/13/17/18 se excluyen.)
4. **Precios:**
   - Con oferta válida: `unitPrice` = precio oferta, `unitPriceBeforeDiscount` =
     precio venta, `discountPercent` = redondeo de `(1 − oferta/venta) × 100`.
   - Sin oferta: `unitPrice` = precio venta, `unitPriceBeforeDiscount` = null,
     `discountPercent` = 0.
   - `bultoQty` = UXB. `bultoPrice` = `unitPrice × UXB × (1 − %DESC/100)` usando la
     hoja `DESC X CANTIDAD` (fila del mismo COD con mayor `LLEVA` ≤ UXB); sin
     entrada, `bultoPrice` = `unitPrice × UXB`.
   - Precios redondeados a entero (pesos).
5. **Stock por sucursal (inventado, determinístico):** el stock real total se
   reparte entre las 8 sucursales con pesos pseudoaleatorios sembrados con el COD
   (misma salida en cada corrida). Reglas:
   - Cada producto tiene stock 0 en 1–3 sucursales elegidas por la semilla, para
     que siempre existan casos de redirección demostrables.
   - El resto se reparte proporcional a los pesos; la suma iguala el stock real
     (capado a 500 unidades por producto para que los números sean creíbles).
6. **Flags:** `freeShipping` = true si `bultoPrice` ≥ $40.000. `lastUnits` se
   elimina del JSON: pasa a calcularse en runtime por sucursal (ver Sección 4).
7. Escribe `frontend/lib/data/products.json` ordenado por descuento desc, con la
   forma del tipo `StaticProduct` (abajo).

### Tipos nuevos/modificados (`lib/types.ts`)

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
  stockBySucursal: Record<string, number>;  // clave = Sucursal.id
}
```

`Product` conserva su forma para los componentes; donde haga falta `lastUnits`
se calcula por sucursal. `imageUrl` no aplica (el ProductCard ya renderiza
placeholder "foto producto" siempre).

### `lib/data/sucursales.ts`

Las 8 sucursales reales (datos del sitio oficial), coordenadas aproximadas
geocodificadas a mano — precisión de barrio, suficiente para la demo:

| id | nombre | dirección | teléfono |
|---|---|---|---|
| claypole | Claypole | Av. Lacaze 5948, Claypole | 11-2257-7736 |
| villa-la-florida | Villa La Florida | Av. Monteverde 2246, Villa La Florida | 11-5314-3597 |
| santa-rosa | Santa Rosa | Av. Eva Perón 5743, Santa Rosa | 11-5058-3489 |
| solano | San Fco. Solano | Av. Monteverde 376 | 11-3313-9137 |
| quilmes-oeste | Quilmes Oeste | Felipe Amoedo 1998, Quilmes Oeste | 11-2287-7530 |
| dardo-rocha | Dardo Rocha | Dardo Rocha 1752 | 11-6604-8467 |
| la-plata | La Plata | Av. 44 Nº 2574, La Plata | 11-5457-5418 |
| bernal | Bernal | Av. Los Quilmes 81, Bernal | 11-2376-9848 |

Horarios: los del sitio real (Lun-Vie/Sáb/Dom con sus rangos por sucursal).

## Sección 2 — Ubicación y cercanía

### `SucursalContext` (nuevo)

Estado: `{ sucursal: Sucursal; userCoords: {lat,lng} | null; hasChosen: boolean }`,
persistido en localStorage (`maxi_sucursal_v1`).

- Default sin elección previa: **Claypole** con `hasChosen = false` — el selector
  del header muestra un hint visual ("Elegí tu sucursal") hasta que el usuario elija.
- `useMiUbicacion()`: pide `navigator.geolocation.getCurrentPosition`; con permiso,
  guarda coords y selecciona la sucursal más cercana. Si el permiso se niega o
  falla, no hay error intrusivo: queda el selector manual.
- `elegirSucursal(id)`: selección manual; conserva coords si existían.

### `lib/geo.ts` (lógica pura)

- `haversineKm(a, b)`: distancia en línea recta.
- `sucursalesPorDistancia(desde)`: las 8 ordenadas por distancia con `distanciaKm`.
- `formatKm(km)`: "4,2 km" (formato es-AR).

### `SucursalSelector` (nuevo componente client)

Reemplaza el texto estático "Elegí tu sucursal" del top bar del Header. Dropdown:

- Cabecera: "Usar mi ubicación" (ícono GPS).
- Lista de las 8 sucursales; si hay `userCoords`, cada una muestra distancia y
  están ordenadas por cercanía.
- Cerrado muestra: `location_on` + nombre de la sucursal activa (+ distancia si
  hay coords).

## Sección 3 — Carrito y checkout

### `CartContext` (reescrito)

- Estado en localStorage (`maxi_cart_v1`), hidratado en el cliente
  (render inicial: carrito vacío para evitar mismatch de hidración).
- **Misma interfaz pública** que hoy: `cart`, `loading`, `addItem`,
  `updateItemQuantity`, `removeItem`, `checkout`, `itemCount` — Header y
  ProductCard casi no cambian. Las funciones dejan de ser llamadas HTTP y pasan a
  operaciones puras en `lib/cart.ts` + persistencia.
- `itemId` = `${productId}:${mode}`. `quantity` en unidades (modo bulto agrega
  `bultoQty` unidades, como hoy).
- Sin exigencia de login: se elimina el `window.alert` de ProductCard y los gates
  `isAuthenticated` del checkout. AuthContext y el botón de Google quedan como están.

### `lib/stock.ts` (lógica pura)

```ts
stockDe(product, sucursalId): number
validateCart(items, sucursalId, products):
  { ok: true } | { ok: false; faltantes: Array<{ productId; nombre; pedido; disponible }> }
findNearestWithFullStock(items, sucursales, desde, products):
  { sucursal; distanciaKm } | null   // recorre por distancia; null si ninguna cubre todo
mejorCobertura(items, sucursales, products):
  { sucursal; faltantes }            // la que menos faltantes tiene (desempate: más cercana)
```

`desde` = coords del usuario si hay GPS; si no, coords de la sucursal activa.

### Checkout

1. Muestra bloque "Retirás en: {sucursal} — {dirección}" con link "cambiar".
2. Al cargar y en cada cambio de carrito/sucursal corre `validateCart`.
3. **Si falta stock**, panel de redirección en lugar del botón de confirmar:
   - Detalle: "Claypole no tiene stock suficiente de MANTECA S Y S X 200 GR
     (pediste 24, hay 10)".
   - Si `findNearestWithFullStock` encuentra sucursal: "**Bernal** (a 4,2 km)
     tiene todo tu pedido" + botones **[Retirar en Bernal]** (cambia la sucursal
     activa y revalida) y **[Ajustar cantidades]** (permite editar los ítems).
   - Si ninguna cubre todo: muestra `mejorCobertura` — "La que más se acerca es
     Bernal; igual le faltan 5 unidades de X" + botón de ajustar cantidades.
4. Con stock OK: botón "Confirmar compra" genera pedido local
   (id `MX-` + timestamp base36), muestra la confirmación existente con la
   sucursal de retiro, y vacía el carrito. El stock **no** se descuenta
   (datos estáticos de demo).

## Sección 4 — UI de producto y catálogo

### ProductCard

- Badge de stock según la sucursal activa:
  - stock ≥ 2×UXB → verde: "Quedan {n} en {sucursal}".
  - 0 < stock < 2×UXB → naranja: "Últimas {n} unidades en {sucursal}" (reemplaza
    al flag estático `lastUnits`).
  - stock = 0 → gris: "Sin stock en {sucursal} · hay en {másCercanaConStock}
    ({distancia})"; el botón Agregar se deshabilita en esa sucursal.
- El resto de la tarjeta (precios unidad/bulto, descuento, envío gratis) igual.

### Home (`app/page.tsx`)

- Importa `products.json` directamente (sin fetch, sin `API_URL`).
- "Productos destacados" = top 8 por `discountPercent`.
- "Ofertas on fire" = siguientes con descuento u ofertas restantes (12).

### Catálogo (`app/productos/page.tsx`, nuevo)

- Grid de ProductCards con los ~200 productos.
- Búsqueda por texto (nombre, insensible a mayúsculas/acentos) conectada al
  buscador del header (`/productos?q=...`).
- Filtro por categoría (chips u opciones), conectado a la fila de categorías del
  header (`/productos?cat=...`), que pasa a generarse desde las categorías reales
  del JSON.
- Client component con `useSearchParams` (compatible con export estático).

## Manejo de errores

- **GPS negado/no disponible:** silencioso; queda selección manual con hint.
- **localStorage inaccesible** (modo incógnito estricto): los contextos degradan a
  estado en memoria; la sesión funciona, solo no persiste.
- **JSON/data corrupta en localStorage:** try/parse con fallback a estado inicial.
- **Carrito imposible** (ninguna sucursal cubre): nunca bloquea sin salida — siempre
  ofrece ajustar cantidades y muestra la mejor cobertura.

## Pruebas

- **vitest** (nuevo, devDependency) para la lógica pura: `lib/geo.ts`
  (haversine, orden por distancia), `lib/stock.ts` (validación, redirección,
  mejor cobertura), `lib/cart.ts` (add/update/remove/totales).
- El generador valida su salida (suma de stock por sucursal = stock capado,
  precios > 0, ≥1 sucursal en cero cuando corresponde) y falla ruidosamente.
- Verificación integral: `npm run build` (export estático) + flujo manual:
  elegir sucursal → agregar más que el stock → ver redirección → confirmar.

## Fuera de alcance (esta etapa)

- Página `/sucursales` con mapa, badge "abierto ahora", multi-retiro por ítem.
- Descuento de stock al confirmar pedido; historial de pedidos.
- Imágenes de producto (se mantiene el placeholder actual).
- Cambios en el backend .NET o capa conmutable estático/API.
