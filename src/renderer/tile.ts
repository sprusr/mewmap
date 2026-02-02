import { TILE_EXTENT } from "../constants.js";
import type { PreparedTile, Source, Style } from "../types.js";
import * as fill from "./layers/fill.js";
import * as line from "./layers/line.js";
import type { RenderedLayer, RenderedTile } from "./types.js";

export const renderTile = async ({
  tile: { x, y, z },
  cache,
  source,
  style,
}: {
  tile: { x: number; y: number; z: number };
  source: Source;
  style: Style;
  cache: Map<string, RenderedTile | null>;
}): Promise<RenderedTile | null> => {
  const cached = cache.get(`${x}-${y}-${z}`);
  if (cached !== undefined) {
    return cached;
  }
  const preparedTile = await style.prepare({ source, tile: { x, y, z } });
  const renderedTile = {
    coordinates: { x, y, z },
    layers: renderTileLayers(preparedTile),
  };
  cache.set(`${x}-${y}-${z}`, renderedTile);
  return renderedTile;
};

const renderTileLayers = (
  tile: PreparedTile,
): Record<string, RenderedLayer> => {
  const layerElements: Record<string, RenderedLayer> = {};

  for (const layer of Object.values(tile.layers)) {
    if (layer.type === "raster") {
      const image = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "image",
      );
      image.setAttribute("x", "-1");
      image.setAttribute("y", "-1");
      image.setAttribute("width", (TILE_EXTENT + 2).toString());
      image.setAttribute("height", (TILE_EXTENT + 2).toString());
      image.setAttribute("href", layer.url);
      layerElements[layer.name] = { element: image, repaint: null };
    } else if (layer.type === "fill") {
      layerElements[layer.name] = fill.render(layer);
    } else if (layer.type === "line") {
      layerElements[layer.name] = line.render(layer);
    }
  }

  return layerElements;
};
