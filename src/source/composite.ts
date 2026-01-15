import type { Source } from "../types.js";

export const composite = (...sources: Source[]): Source => {
  return {
    get name() {
      return null;
    },
    async fetch({ name, tile: { x, y, z } }) {
      return (
        sources
          .find((source) => source.name === name)
          ?.fetch({ name, tile: { x, y, z } }) ?? null
      );
    },
  };
};
