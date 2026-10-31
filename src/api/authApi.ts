import { api, apiError } from "./client";
import type { CompleteSetupPayload, LoginResponse, User } from "../auth/types";

// Only used by the login page's quick-fill buttons. The real accounts live in the database (DbSeeder).
export const DEMO_ACCOUNTS: User[] = [
  { id: 1, email: "owner@stockpilot.ph", fullName: "Maria Santos", role: "Owner", isFirstLogin: false },
  { id: 2, email: "manager@stockpilot.ph", fullName: "Paolo Reyes", role: "Manager", isFirstLogin: false },
  { id: 3, email: "cashier@stockpilot.ph", fullName: "Liza Cruz", role: "Cashier", isFirstLogin: false },
  { id: 4, email: "clerk@stockpilot.ph", fullName: "Jun Dela Cruz", role: "InventoryClerk", isFirstLogin: false },
];

export const authApi = {
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const { data } = await api.post<LoginResponse>("/auth/login", { email, password });
      return data;
    } catch (err) {
      throw apiError(err, "Invalid email or password.");
    }
  },

  // idToken is the credential Google hands the browser; the API verifies it with Google
  async google(idToken: string): Promise<LoginResponse> {
    try {
      const { data } = await api.post<LoginResponse>("/auth/google", { idToken });
      return data;
    } catch (err) {
      throw apiError(err, "Google sign-in failed. Please try again.");
    }
  },

  // The request interceptor adds the saved token, so no argument is needed
  async me(): Promise<User> {
    try {
      const { data } = await api.get<User>("/auth/me");
      return data;
    } catch (err) {
      throw apiError(err, "Session expired. Sign in again.");
    }
  },

  async completeSetup(payload: CompleteSetupPayload): Promise<User> {
    try {
      const { data } = await api.post<User>("/onboarding/complete", payload);
      return data;
    } catch (err) {
      throw apiError(err, "We couldn't finish setting up your account. Please try again.");
    }
  },
};