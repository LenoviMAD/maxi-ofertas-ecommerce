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
