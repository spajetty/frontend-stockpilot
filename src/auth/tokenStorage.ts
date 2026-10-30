const KEY = "stockpilot.token";

// "Remember me" checked -> localStorage (survives browser restart)
// Unchecked -> sessionStorage (cleared when the tab closes)
export const tokenStorage = {
  get: () => localStorage.getItem(KEY) ?? sessionStorage.getItem(KEY),
  set: (token: string, remember: boolean) => {
    tokenStorage.clear();
    (remember ? localStorage : sessionStorage).setItem(KEY, token);
  },
  clear: () => {
    localStorage.removeItem(KEY);
    sessionStorage.removeItem(KEY);
  },
};