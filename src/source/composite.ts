import type { Source } from "../types.js";

export const composite = (...sources: Source[]): Source => {
  return {
    async fetch({ name, tile: { x, y, z } }) {
      return (
        (
          await Promise.all(
            sources.map((source) => source.fetch({ name, tile: { x, y, z } })),
          )
        ).find((tile) => tile !== null) ?? null
      );
    },
  };
};
