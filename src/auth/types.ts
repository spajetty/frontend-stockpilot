export type Role = "Owner" | "Manager" | "Cashier" | "InventoryClerk";
export type Gender = "Male" | "Female" | "Other" | "PreferNotToSay";

export interface User {
  id: number;
  email: string;
  fullName: string; // display name: first + surname, or the email until setup is done
  role: Role;
  isFirstLogin: boolean; // true until personal info and a new password are saved
}

// Same shape the ASP.NET Core API returns from POST /api/auth/login and /api/auth/google
export interface LoginResponse {
  token: string;
  expiresAt: string; // ISO date
  user: User;
}

export interface CompleteSetupPayload {
  firstName: string;
  middleName?: string;
  surname: string;
  birthday: string; // yyyy-MM-dd
  gender: Gender;
  newPassword: string;
}

export interface StaffMember {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  isFirstLogin: boolean;
  isActive: boolean;
  createdAt: string;
}