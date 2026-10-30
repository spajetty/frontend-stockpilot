export type Role = "Owner" | "Manager" | "Cashier" | "InventoryClerk";

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: Role;
}

// Same shape the ASP.NET Core API will return from POST /api/auth/login
export interface LoginResponse {
  token: string;
  expiresAt: string; // ISO date
  user: User;
}