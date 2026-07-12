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
