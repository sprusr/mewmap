import type * as z from "zod/mini";
import type { Tile_Layer } from "../../gen/vector_tile_pb.js";
import { evaluate } from "../expression/index.js";
import type * as schema from "../schema.js";
import { decodeGeometry } from "../utils/mvt.js";

export const extractGeometry = (
  styleLayer: z.output<typeof schema.layer>,
  tileLayer: Tile_Layer,
) => {
  const tileFeatures =
    "filter" in styleLayer
      ? tileLayer.features.filter((feature) =>
          // biome-ignore lint/suspicious/noExplicitAny: until types are completed
          evaluate(styleLayer.filter as any, { layer: tileLayer, feature }),
        )
      : tileLayer.features;

  const geometry = tileFeatures
    .map((tileFeature) => decodeGeometry(tileFeature))
    .filter((geometry) => geometry !== null)
    .filter((geometry) =>
      styleLayer.type === "fill"
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
        type: styleLayer.type === "fill" ? "polygon" : "linestring",
        commands: [],
      },
    );

  return geometry;
};
