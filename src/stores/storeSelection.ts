const KEY = 'stockpilot.activeStoreId';

export function getStoredStoreId(): number | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const id = Number(raw);
    return Number.isInteger(id) && id > 0 ? id : null;
  } catch {
    return null; 
  }
}

export function setStoredStoreId(id: number | null): void {
  try {
    if (id === null) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, String(id));
  } catch {
    
  }
}