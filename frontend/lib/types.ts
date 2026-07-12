export interface Product {
  id: string;
  name: string;
  category: string;
  discountPercent: number;
  unitPrice: number;
  unitPriceBeforeDiscount: number | null;
  bultoPrice: number;
  bultoQty: number;
  freeShipping: boolean;
  lastUnits: boolean;
  imageUrl: string | null;
}

export type PriceMode = "unidad" | "bulto";

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  mode: PriceMode;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  total: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  mode: PriceMode;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: string;
  status: "Pending" | "Paid" | "Cancelled";
  createdAt: string;
  total: number;
  items: OrderItem[];
}

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
