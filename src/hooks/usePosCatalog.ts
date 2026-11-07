import { useQuery } from '@tanstack/react-query';
import { fetchCatalog, posKeys } from '../api/posApi';

export function usePosCatalog(storeId: number | null) {
  return useQuery({
    queryKey: posKeys.catalog(storeId ?? 0),
    queryFn: () => fetchCatalog(storeId!),
    enabled: storeId != null,
  });
}