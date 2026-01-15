import type { Style } from "../types.js";

export const dummy = (): Style => {
  return {
    background: null,
    layers: [],
    prepare() {
      return { layers: {} };
    },
  };
};
