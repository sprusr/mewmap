import type { PreparedFeatureContext } from "../types.js";

export type TileCoordinates = {
  x: number;
  y: number;
  z: number;
};

export type RenderedLayer = {
  element: SVGElement;
  repaint: ((context: PreparedFeatureContext) => void) | null;
};

export type RenderedTile = {
  coordinates: TileCoordinates;
  layers: Record<string, RenderedLayer>;
};
