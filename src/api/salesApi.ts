import { api } from './client';
import type { PaymentMethodName } from './posApi';

export const SALES_PAGE_SIZE = 5;

export type PaymentFilter = 'all' | PaymentMethodName;
export type StatusFilter = 'all' | 'completed' | 'partiallyrefunded' | 'refunded' | 'voided';
export type SortBy = 'date' | 'total';
export type SortDir = 'asc' | 'desc';

export type SaleStatusName = 'Completed' | 'PartiallyRefunded' | 'Refunded' | 'Voided';
export type PaymentStatusName = 'Paid' | 'PartiallyRefunded' | 'Refunded';

export interface SalesQueryParams {
  page: number;
  sortBy: SortBy;
  sortDir: SortDir;
  payment: PaymentFilter;
  status: StatusFilter;
  search: string;
}

export interface SaleListItem {
  id: number;
  saleNumber: string;
  createdAt: string;
  cashierName: string;
  items: number;
  subtotal: number;
  total: number;
  paymentMethod: PaymentMethodName;
  paymentStatus: PaymentStatusName;
  status: SaleStatusName;
}

export interface SalesPage {
  items: SaleListItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface SaleDetailItem { name: string; sku: string; quantity: number; unitPrice: number; lineTotal: number }
export interface SaleRefund { id: number; amount: number; reason: string; processedBy: string; createdAt: string }

export interface SaleDetail {
  id: number;
  saleNumber: string;
  createdAt: string;
  cashierName: string;
  paymentMethod: PaymentMethodName;
  paymentStatus: PaymentStatusName;
  status: SaleStatusName;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  refundedTotal: number;
  items: SaleDetailItem[];
  refunds: SaleRefund[];
}

export interface SaleDetailItem {
  id: number;
  refundedQuantity: number;
  name: string; sku: string; quantity: number; unitPrice: number; lineTotal: number;
}

export const salesKeys = {
  list: (storeId: number, p: SalesQueryParams) => ['sales', 'list', storeId, p] as const,
  detail: (id: number) => ['sales', 'detail', id] as const,
};

export async function fetchSales(p: SalesQueryParams): Promise<SalesPage> {
  const { data } = await api.get<SalesPage>('/sales', {
    params: {
      page: p.page,
      pageSize: SALES_PAGE_SIZE,
      sortBy: p.sortBy,
      sortDir: p.sortDir,
      payment: p.payment === 'all' ? undefined : p.payment,
      status: p.status === 'all' ? undefined : p.status,
      search: p.search || undefined,
    },
  });
  return data;
}

export async function fetchSale(id: number): Promise<SaleDetail> {
  const { data } = await api.get<SaleDetail>(`/sales/${id}`);
  return data;
}

export interface RefundRequest {
  items: { saleItemId: number; quantity: number }[];
  reason: string;
  returnToStock: boolean;
}

export async function createRefund(saleId: number, req: RefundRequest): Promise<SaleDetail> {
  const { data } = await api.post<SaleDetail>(`/sales/${saleId}/refunds`, req);
  return data;
}