import type { Role } from "./types";

export const ROLE_LABEL: Record<Role, string> = {
  Owner: "Owner",
  Manager: "Manager",
  Cashier: "Cashier",
  InventoryClerk: "Inventory clerk",
};

// Roles an owner can assign when adding staff
export const INVITABLE_ROLES: Role[] = ["Manager", "Cashier", "InventoryClerk"];