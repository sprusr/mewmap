import type { Source } from "../types.js";

export const raster = ({ name: sourceName }: { name: string }): Source => {
  return {
    async fetch({ name, tile: { x, y, z } }) {
      if (name !== sourceName) {
        return null;
      }

      // prefetch image so that it's in cache
      await fetch(
        `https://versatiles-satellite.b-cdn.net/tiles/orthophotos/${z}/${x}/${y}`,
      );

      return {
        type: "raster",
        url: `https://versatiles-satellite.b-cdn.net/tiles/orthophotos/${z}/${x}/${y}`,
        x,
        y,
        z,
      };
    },
  };
};
