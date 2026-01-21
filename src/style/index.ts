import type * as z from "zod/mini";
import type { PreparedTile, Style, Tile } from "../types.js";
import * as fill from "./layers/fill.js";
import * as line from "./layers/line.js";
import type * as schema from "./schema.js";

export const style = (spec: z.input<typeof schema.style>): Style => {
  return {
    background: getBackground(spec),
    layers: spec.layers.map((layer) => ({ name: layer.id })),
    async prepare({ source, tile }) {
      const sourceTiles = new Map<string, Tile | null>();
      const fetchSourceTileCached = async (name: string) => {
        const cached = sourceTiles.get(name);
        if (cached !== undefined) return cached;
        const sourceTile = await source.fetch({ name, tile });
        sourceTiles.set(name, sourceTile);
        return sourceTile;
      };

      const filteredLayers = spec.layers.filter(
        (layer) =>
          (layer.minzoom === undefined || layer.minzoom <= tile.z) &&
          layer.type !== "background",
      );

      const preparedTile: PreparedTile = { layers: {} };

      for (const layer of filteredLayers) {
        if (layer.type === "fill") {
          const sourceTile = await fetchSourceTileCached(layer.source);
          if (!sourceTile || sourceTile.type !== "vector") continue;
          const prepared = fill.prepare(sourceTile, layer);
          if (!prepared) continue;
          preparedTile.layers[layer.id] = prepared;
        } else if (layer.type === "line") {
          const sourceTile = await fetchSourceTileCached(layer.source);
          if (!sourceTile || sourceTile.type !== "vector") continue;
          const prepared = line.prepare(sourceTile, layer);
          if (!prepared) continue;
          preparedTile.layers[layer.id] = prepared;
        } else if (layer.type === "raster") {
          const sourceTile = await fetchSourceTileCached(layer.source);
          if (!sourceTile || sourceTile.type !== "raster") continue;
          preparedTile.layers[layer.id] = {
            type: "raster",
            name: layer.id,
            url: sourceTile.url,
          };
        }
      }

      return preparedTile;
    },
  };
};

const getBackground = (spec: z.input<typeof schema.style>): string | null => {
  const background = spec.layers.find((layer) => layer.type === "background")
    ?.paint?.["background-color"];
  if (typeof background === "string") {
    return background;
  }
  return null;
};
