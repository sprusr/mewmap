import type { Source } from "../types.js";

export const dummy = (): Source => {
  return {
    get name() {
      return null;
    },
    async fetch() {
      return null;
    },
  };
};
