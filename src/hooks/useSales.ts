import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createRefund,
  fetchSale,
  fetchSales,
  salesKeys,
  type RefundRequest,
  type SalesQueryParams,
} from '../api/salesApi';
import { useStores } from '../stores/StoreContext';

export function useSales(params: SalesQueryParams) {
  const { activeStore } = useStores();
  return useQuery({
    queryKey: salesKeys.list(activeStore?.id ?? 0, params),
    queryFn: () => fetchSales(params),
    placeholderData: keepPreviousData,
  });
}

export function useSaleDetail(id: number | null) {
  return useQuery({
    queryKey: salesKeys.detail(id ?? 0),
    queryFn: () => fetchSale(id!),
    enabled: id != null,
  });
}

export function useRefundSale(saleId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: RefundRequest) => createRefund(saleId, req),
    onSuccess: (detail) => {
      qc.setQueryData(salesKeys.detail(saleId), detail);          
      qc.invalidateQueries({ queryKey: ['sales', 'list'] });      
      qc.invalidateQueries({ queryKey: ['pos', 'catalog'] });     
    },
  });
}