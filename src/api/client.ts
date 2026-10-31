import axios from "axios";
import { tokenStorage } from "../auth/tokenStorage";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Attach the saved JWT to every request
api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Turns any axios failure into an Error with a message that's safe to show in the UI
export function apiError(err: unknown, fallback: string): Error {
  if (!axios.isAxiosError(err)) return new Error(fallback);
  if (!err.response) return new Error("Can't reach the server. Is the API running?");

  const data = err.response.data as
    | { message?: string; errors?: Record<string, string[]> }
    | undefined;
  const firstValidation = data?.errors ? Object.values(data.errors)[0]?.[0] : undefined;
  return new Error(data?.message ?? firstValidation ?? fallback);
}