import { TILE_EXTENT } from "../constants.js";
import { decodeGeometry } from "../mvt.js";
import type { PreparedTile, Style } from "../types.js";
import { LAYERS } from "./constants.js";
import { evaluate } from "./expression/index.js";
import { stops } from "./expression/utils.js";

export const style = (): Style => {
  return {
    background:
      LAYERS.find((layer) => layer.type === "background")?.paint[
        "background-color"
      ] ?? null,
    layers: LAYERS.map((layer) => ({ name: layer.id })),
    prepare(tile) {
      const filteredLayers = LAYERS.filter(
        (layer) =>
          (layer.minzoom === undefined || layer.minzoom <= tile.z) &&
          layer.type !== "background",
      );

      const preparedTile: PreparedTile = { layers: {} };

      for (const layer of filteredLayers) {
        if (layer.type === "fill" || layer.type === "line") {
          const tileLayer = tile.layers.find(
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
              fill: layer.paint["fill-color"],
              stroke: layer.paint["line-color"],
              strokeWidth:
                layer.paint["line-width"] !== undefined
                  ? stops(
                      tile.z,
                      layer.paint["line-width"].stops as [number, number][],
                    )
                  : undefined,
              opacity: getOpacity(layer, tile.z),
            },
          };

          preparedTile.layers[layer.id] = {
            name: layer.id,
            features: [feature],
          };
        }
      }

      return preparedTile;
    },
  };
};

const getOpacity = (layer: (typeof LAYERS)[number], z: number): number => {
  if (layer.type === "fill") {
    return layer.paint["fill-opacity"] !== undefined
      ? typeof layer.paint["fill-opacity"] !== "number"
        ? stops(z, layer.paint["fill-opacity"].stops as [number, number][])
        : layer.paint["fill-opacity"]
      : 1;
  } else if (layer.type === "line") {
    return layer.paint["line-opacity"] !== undefined
      ? typeof layer.paint["line-opacity"] !== "number"
        ? stops(z, layer.paint["line-opacity"].stops as [number, number][])
        : layer.paint["line-opacity"]
      : 1;
  }
  return 1;
};
