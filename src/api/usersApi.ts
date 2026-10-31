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

  // The API generates the temporary password and emails it; it is never sent back here
  async invite(email: string, role: Role): Promise<StaffMember> {
    try {
      const { data } = await api.post<StaffMember>("/users", { email, role });
      return data;
    } catch (err) {
      throw apiError(err, "Couldn't create the account. Please try again.");
    }
  },
};