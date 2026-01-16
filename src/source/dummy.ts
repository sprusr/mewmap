import type { Source } from "../types.js";

export const dummy = (): Source => {
  return {
    async fetch() {
      return null;
    },
  };
};
