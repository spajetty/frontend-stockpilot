import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { applyStockChanges, posKeys, type StockChange } from '../api/posApi';
import { tokenStorage } from '../auth/tokenStorage';

export type LiveStatus = 'connecting' | 'live' | 'reconnecting' | 'offline';

const HUB_URL = `${(import.meta.env.VITE_API_URL as string).replace(/\/api\/?$/, "")}/hubs/stock`;

export function useLiveStock(storeId: number | null): LiveStatus {
  const qc = useQueryClient();
  const [status, setStatus] = useState<LiveStatus>('connecting');

  useEffect(() => {
    if (storeId == null) return;
    const key = posKeys.catalog(storeId);

    const conn = new HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => tokenStorage.get() ?? '',
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    conn.on('stockChanged', (changes: StockChange[]) => applyStockChanges(qc, storeId, changes));

    conn.onreconnecting(() => setStatus('reconnecting'));
    conn.onreconnected(async () => {
      await conn.invoke('JoinStore', storeId);
      await qc.invalidateQueries({ queryKey: key });   
      setStatus('live');
    });
    conn.onclose(() => setStatus('offline'));

    let disposed = false;
    conn.start()
      .then(async () => {
        if (disposed) return;
        await conn.invoke('JoinStore', storeId);
        setStatus('live');
      })
      .catch(() => { if (!disposed) setStatus('offline'); });

    return () => {
      disposed = true;
      conn.off('stockChanged');
      if (conn.state !== HubConnectionState.Disconnected) void conn.stop();
    };
  }, [storeId, qc]);

  return status;
}