import { TILE_EXTENT } from "../constants.js";
import { decodeGeometry } from "../mvt.js";
import type { Style } from "../types.js";
import { LAYERS } from "./constants.js";
import { evaluate } from "./expression/index.js";

export const style = (): Style => {
  return {
    renderTile(tile) {
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");

      for (const layer of LAYERS) {
        if (layer.type === "background") {
          const element = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "rect",
          );
          element.setAttribute("width", TILE_EXTENT.toString());
          element.setAttribute("height", TILE_EXTENT.toString());
          element.setAttribute("fill", layer.paint["background-color"]);
          g.appendChild(element);
        } else if (layer.type === "fill") {
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
                  evaluate(layer.filter, { layer: tileLayer, feature }),
                )
              : tileLayer.features;

          for (const tileFeature of tileFeatures) {
            const geometry = decodeGeometry(tileFeature);
            if (geometry !== null) {
              const element = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "path",
              );
              element.setAttribute("fill", layer.paint["fill-color"]);
              element.setAttribute("d", geometry);
              g.appendChild(element);
            }
          }
        }
      }

      return g;
    },
  };
};
