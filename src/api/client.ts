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