import { TILE_EXTENT } from "../constants.js";
import { decodeGeometry } from "../mvt.js";
import type { Style } from "../types.js";
import { LAYERS } from "./constants.js";
import { evaluate } from "./expression/index.js";
import { stops } from "./expression/utils.js";

export const style = (): Style => {
  return {
    renderTile(tile) {
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");

      const filteredLayers = LAYERS.filter(
        (layer) => layer.minzoom === undefined || layer.minzoom <= tile.z,
      );

      for (const layer of filteredLayers) {
        if (layer.type === "background") {
          const element = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "rect",
          );
          element.setAttribute("width", TILE_EXTENT.toString());
          element.setAttribute("height", TILE_EXTENT.toString());
          if (layer.paint["background-color"] !== undefined) {
            element.setAttribute("fill", layer.paint["background-color"]);
          }
          g.appendChild(element);
        } else if (layer.type === "fill" || layer.type === "line") {
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
            .join("M 0,0");

          const element = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path",
          );

          element.setAttribute(
            "fill",
            layer.paint["fill-color"] !== undefined
              ? layer.paint["fill-color"]
              : "none",
          );
          element.setAttribute(
            "stroke",
            layer.paint["line-color"] !== undefined
              ? layer.paint["line-color"]
              : "none",
          );
          element.setAttribute(
            "stroke-width",
            layer.paint["line-width"] !== undefined
              ? stops(
                  tile.z,
                  layer.paint["line-width"].stops as [number, number][],
                ).toString()
              : "0",
          );

          const getOpacity = (layer: (typeof LAYERS)[number]): number => {
            if (layer.type === "fill") {
              return layer.paint["fill-opacity"] !== undefined
                ? typeof layer.paint["fill-opacity"] !== "number"
                  ? stops(
                      tile.z,
                      layer.paint["fill-opacity"].stops as [number, number][],
                    )
                  : layer.paint["fill-opacity"]
                : 1;
            } else if (layer.type === "line") {
              return layer.paint["line-opacity"] !== undefined
                ? typeof layer.paint["line-opacity"] !== "number"
                  ? stops(
                      tile.z,
                      layer.paint["line-opacity"].stops as [number, number][],
                    )
                  : layer.paint["line-opacity"]
                : 1;
            }
            return 1;
          };
          element.setAttribute("opacity", getOpacity(layer).toString());

          element.setAttribute("d", geometry);
          g.appendChild(element);
        }
      }

      return g;
    },
  };
};
