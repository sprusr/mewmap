import type { Source } from "../types.js";

export const raster = ({ name: sourceName }: { name: string }): Source => {
  return {
    async fetch({ name, tile: { x, y, z } }) {
      if (name !== sourceName) {
        return null;
      }

      // attempt to prefetch image so that it's in cache
      try {
        await fetch(
          `https://tiles.versatiles.org/tiles/satellite/${z}/${x}/${y}`,
        );
      } catch {}

      return {
        type: "raster",
        url: `https://tiles.versatiles.org/tiles/satellite/${z}/${x}/${y}`,
        x,
        y,
        z,
      };
    },
  };
};
