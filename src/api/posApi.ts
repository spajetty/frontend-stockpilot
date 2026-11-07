import { api } from './client';
import type { QueryClient } from '@tanstack/react-query';

export interface PosCategory { id: number; name: string }

export type PaymentMethodName = 'Cash' | 'Card' | 'PayPal';

export interface PosProduct {
  id: number;
  name: string;
  sku: string;
  barcode: string | null;
  categoryId: number | null;
  price: number;
  imageUrl: string | null;
  stock: number;
  reorderLevel: number;
}

export interface PosCatalog {
  storeId: number;
  taxRate: number;          
  categories: PosCategory[];
  products: PosProduct[];
}

export interface CheckoutRequest {
  storeId: number;
  items: { productId: number; quantity: number }[];
  discount: number;
  paymentMethod: PaymentMethodName;
  cashTendered: number | null;
}

export interface StockChange { productId: number; quantity: number }

export interface ReceiptItem { name: string; sku: string; quantity: number; unitPrice: number; lineTotal: number }

export interface Receipt {
  saleId: number;
  saleNumber: string;
  createdAt: string;
  storeName: string;
  cashierName: string;
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
  taxRate: number;
  tax: number;
  total: number;
  paymentMethod: string;
  cashTendered: number | null;
  changeDue: number | null;
}

export interface CheckoutResponse { receipt: Receipt; stockChanges: StockChange[] }

export type StockStatus = 'out' | 'low' | 'ok';

export const stockStatus = (p: PosProduct): StockStatus =>
  p.stock <= 0 ? 'out' : p.stock <= p.reorderLevel ? 'low' : 'ok';

export const posKeys = {
  catalog: (storeId: number) => ['pos', 'catalog', storeId] as const,
};

export async function fetchCatalog(storeId: number): Promise<PosCatalog> {
  const { data } = await api.get<PosCatalog>('/pos/catalog', { params: { storeId } });
  return data;
}

export async function checkout(req: CheckoutRequest): Promise<CheckoutResponse> {
  const { data } = await api.post<CheckoutResponse>('/pos/checkout', req);
  return data;
}

export function applyStockChanges(qc: QueryClient, storeId: number, changes: StockChange[]) {
  const byId = new Map(changes.map((c) => [c.productId, c.quantity]));
  qc.setQueryData<PosCatalog>(posKeys.catalog(storeId), (old) =>
    old && {
      ...old,
      products: old.products.map((p) => (byId.has(p.id) ? { ...p, stock: byId.get(p.id)! } : p)),
    });
}