import type * as z from "zod/mini";
import { TILE_EXTENT } from "../constants.js";
import { decodeGeometry } from "../mvt.js";
import type { PreparedFeature, PreparedTile, Style, Tile } from "../types.js";
import { evaluate } from "./expression/index.js";
import { stops } from "./expression/utils.js";
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
        if (layer.type === "fill" || layer.type === "line") {
          const sourceTile = await fetchSourceTileCached(layer.source);
          if (!sourceTile || sourceTile.type !== "vector") continue;

          const tileLayer = sourceTile.layers.find(
            (tileLayer) => tileLayer.name === layer["source-layer"],
          );
          if (!tileLayer) continue;

          if (tileLayer.extent !== TILE_EXTENT) {
            throw new Error(
              `Tile extent other than ${TILE_EXTENT} is not yet supported`,
            );
          }

          const tileFeatures =
            "filter" in layer
              ? tileLayer.features.filter((feature) =>
                  // biome-ignore lint/suspicious/noExplicitAny: until types are completed
                  evaluate(layer.filter as any, { layer: tileLayer, feature }),
                )
              : tileLayer.features;

          const geometry = tileFeatures
            .map((tileFeature) => decodeGeometry(tileFeature))
            .filter((geometry) => geometry !== null)
            .filter((geometry) =>
              layer.type === "fill"
                ? geometry.type === "polygon"
                : geometry.type === "linestring",
            )
            .reduce(
              (acc, geometry) => {
                acc.commands.push(
                  ...(acc.commands.length
                    ? [{ type: "reset" as const }, ...geometry.commands]
                    : geometry.commands),
                );
                return acc;
              },
              {
                type: layer.type === "fill" ? "polygon" : "linestring",
                commands: [],
              },
            );

          const feature = {
            geometry,
            static: {
              fill: getFill(layer),
              fillTranslate: getFillTranslate(layer),
              stroke: getStroke(layer),
              strokeWidth: getStrokeWidth(layer, tile.z),
              opacity: getOpacity(layer, tile.z),
            },
          } satisfies PreparedFeature;

          preparedTile.layers[layer.id] = {
            type: "vector",
            name: layer.id,
            features: [feature],
          };
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

const getFill = (layer: z.input<typeof schema.layer>): string | undefined => {
  if (
    layer.type !== "fill" ||
    typeof layer.paint?.["fill-color"] !== "string"
  ) {
    return undefined;
  }
  return layer.paint["fill-color"];
};

const getFillTranslate = (
  layer: z.input<typeof schema.layer>,
): { x: number; y: number } | undefined => {
  if (
    layer.type !== "fill" ||
    layer.paint?.["fill-translate"] === undefined ||
    !Array.isArray(layer.paint["fill-translate"]) ||
    layer.paint["fill-translate"].length !== 2 ||
    typeof layer.paint["fill-translate"][0] !== "number" ||
    typeof layer.paint["fill-translate"][1] !== "number"
  ) {
    return undefined;
  }
  const [x, y] = layer.paint["fill-translate"];
  if (x === undefined || y === undefined) {
    return undefined;
  }
  return { x, y };
};

const getStroke = (layer: z.input<typeof schema.layer>): string | undefined => {
  if (
    layer.type !== "line" ||
    typeof layer.paint?.["line-color"] !== "string"
  ) {
    return undefined;
  }
  return layer.paint["line-color"];
};

const getStrokeWidth = (
  layer: z.input<typeof schema.layer>,
  z: number,
): number | undefined => {
  if (layer.type !== "line" || layer.paint?.["line-width"] === undefined) {
    return undefined;
  }
  if (typeof layer.paint["line-width"] === "number") {
    return layer.paint["line-width"];
  }
  if ("stops" in layer.paint["line-width"]) {
    return stops(z, layer.paint?.["line-width"].stops);
  }
  return undefined;
};

const getOpacity = (layer: z.input<typeof schema.layer>, z: number): number => {
  if (layer.type === "fill") {
    if (layer.paint?.["fill-opacity"] === undefined) return 1;
    if (typeof layer.paint["fill-opacity"] === "number")
      return layer.paint["fill-opacity"];
    if ("stops" in layer.paint["fill-opacity"])
      return stops(z, layer.paint?.["fill-opacity"].stops);
  } else if (layer.type === "line") {
    if (layer.paint?.["line-opacity"] === undefined) return 1;
    if (typeof layer.paint["line-opacity"] === "number")
      return layer.paint["line-opacity"];
    if ("stops" in layer.paint["line-opacity"])
      return stops(z, layer.paint?.["line-opacity"].stops);
  }
  return 1;
};
