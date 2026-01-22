import type * as z from "zod/mini";
import { TILE_EXTENT } from "../../constants.js";
import type { PreparedFeatureValue, PreparedLayer, Tile } from "../../types.js";
import type * as schema from "../schema.js";
import { extractGeometry } from "./utils.js";

export const prepare = (
  tile: Extract<Tile, { type: "vector" }>,
  layer: z.output<typeof schema.fillLayer>,
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
    type: "fill",
    name: layer.id,
    features: [{ geometry }],
    paint: {
      "fill-color": color(layer),
      "fill-translate": undefined,
      "fill-opacity": undefined,
    },
    layout: {},
  };
};

const color = (
  layer: z.input<typeof schema.fillLayer>,
): PreparedFeatureValue<string> => {
  if (typeof layer.paint?.["fill-color"] !== "string") {
    return undefined;
  }
  return { type: "constant", value: layer.paint["fill-color"] };
};
