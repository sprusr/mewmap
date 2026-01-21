import type * as z from "zod/mini";
import { TILE_EXTENT } from "../../constants.js";
import type { PreparedLayer, Tile } from "../../types.js";
import { stops } from "../expression/utils.js";
import type * as schema from "../schema.js";
import { extractGeometry } from "./utils.js";

export const prepare = (
  tile: Extract<Tile, { type: "vector" }>,
  layer: z.output<typeof schema.lineLayer>,
): PreparedLayer | null => {
  const tileLayer = tile.layers.find(
    (tileLayer) => tileLayer.name === layer["source-layer"],
  );
  if (!tileLayer) return null;

  if (tileLayer.extent !== TILE_EXTENT) {
    throw new Error(
      `Tile extent other than ${TILE_EXTENT} is not yet supported`,
    );
  }

  const geometry = extractGeometry(layer, tileLayer);

  return {
    type: "line",
    name: layer.id,
    features: [{ geometry }],
    paint: {
      "line-color": color(layer),
      "line-width": width(layer, 16), // TODO: provide actual zoom
      "line-opacity": undefined,
    },
    layout: {},
  };
};

const color = (
  layer: z.input<typeof schema.lineLayer>,
): { type: "constant"; value: string } | undefined => {
  if (typeof layer.paint?.["line-color"] !== "string") {
    return undefined;
  }
  return { type: "constant", value: layer.paint["line-color"] };
};

const width = (
  layer: z.input<typeof schema.lineLayer>,
  z: number,
): { type: "constant"; value: number } | undefined => {
  if (layer.paint?.["line-width"] === undefined) return undefined;
  if (typeof layer.paint?.["line-width"] === "number") {
    return { type: "constant", value: layer.paint["line-width"] };
  }
  if ("stops" in layer.paint["line-width"]) {
    return {
      type: "constant",
      value: stops(z, layer.paint["line-width"].stops),
    };
  }
  return undefined;
};
