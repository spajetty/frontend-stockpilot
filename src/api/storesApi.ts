import { api, apiError } from "./client";
import type { Store } from "../stores/types";

export const storesApi = {
  async list(): Promise<Store[]> {
    try {
      const { data } = await api.get<Store[]>("/stores");
      return data;
    } catch (err) {
      throw apiError(err, "Couldn't load your store.");
    }
  },
};