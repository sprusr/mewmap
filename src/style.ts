import { decodeGeometry } from "./mvt.js";
import type { Style } from "./types.js";

const LAYERS = [
  {
    id: "background",
    type: "background",
    paint: {
      "background-color": "rgb(249,244,238)",
    },
  },
  {
    source: "versatiles-shortbread",
    id: "water-ocean",
    type: "fill",
    "source-layer": "ocean",
    paint: {
      "fill-color": "rgb(190,221,243)",
    },
  },
] as const;

export const style = (): Style => {
  return {
    renderTile(tile) {
      const symbol = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "symbol",
      );

      symbol.setAttribute("viewBox", "0 0 4096 4096");

      for (const layer of LAYERS) {
        if (layer.type === "background") {
          const element = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "rect",
          );
          element.setAttribute("width", "100%");
          element.setAttribute("height", "100%");
          element.setAttribute("fill", layer.paint["background-color"]);
          symbol.appendChild(element);
        } else if (layer.type === "fill") {
          const tileLayer = tile.layers.find(
            (tileLayer) => tileLayer.name === layer["source-layer"],
          );
          if (!tileLayer) continue;

          for (const tileFeature of tileLayer.features) {
            const geometry = decodeGeometry(tileFeature);
            if (geometry !== null) {
              const element = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "path",
              );
              element.setAttribute("fill", layer.paint["fill-color"]);
              element.setAttribute("d", geometry);
              symbol.appendChild(element);
            }
          }
        }
      }

      return symbol;
    },
  };
};
