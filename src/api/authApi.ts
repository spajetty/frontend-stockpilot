import axios from "axios";
import { api } from "./client";
import type { LoginResponse, User } from "../auth/types";

// Only used by the login page's quick-fill buttons. The real accounts live in the database (DbSeeder).
export const DEMO_ACCOUNTS: User[] = [
  { id: 1, email: "owner@stockpilot.ph", fullName: "Maria Santos", role: "Owner" },
  { id: 2, email: "manager@stockpilot.ph", fullName: "Paolo Reyes", role: "Manager" },
  { id: 3, email: "cashier@stockpilot.ph", fullName: "Liza Cruz", role: "Cashier" },
  { id: 4, email: "clerk@stockpilot.ph", fullName: "Jun Dela Cruz", role: "InventoryClerk" },
];

function toError(err: unknown, fallback: string): Error {
  if (axios.isAxiosError(err)) {
    if (!err.response) return new Error("Can't reach the server. Is the API running?");
    const message = (err.response.data as { message?: string } | undefined)?.message;
    return new Error(message ?? fallback);
  }
  return new Error(fallback);
}

export const authApi = {
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const { data } = await api.post<LoginResponse>("/auth/login", { email, password });
      return data;
    } catch (err) {
      throw toError(err, "Invalid email or password.");
    }
  },

  // The request interceptor adds the saved token, so no argument is needed
  async me(): Promise<User> {
    try {
      const { data } = await api.get<User>("/auth/me");
      return data;
    } catch (err) {
      throw toError(err, "Session expired. Sign in again.");
    }
  },
};