import { api, apiError } from "./client";
import type { Role, StaffMember } from "../auth/types";

export const usersApi = {
  async list(): Promise<StaffMember[]> {
    try {
      const { data } = await api.get<StaffMember[]>("/users");
      return data;
    } catch (err) {
      throw apiError(err, "Couldn't load staff accounts.");
    }
  },

  async invite(email: string, role: Role, storeId: number): Promise<StaffMember> {
    try {
      const { data } = await api.post<StaffMember>("/users", { email, role, storeId });
      return data;
    } catch (err) {
      throw apiError(err, "Couldn't create the account. Please try again.");
    }
  },
};