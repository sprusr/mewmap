export type TileCoordinates = {
  x: number;
  y: number;
  z: number;
};

export type RenderedTile = {
  coordinates: TileCoordinates;
  layerElements: Record<string, SVGElement>;
};
