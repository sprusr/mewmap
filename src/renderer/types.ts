export type TileCoordinates = {
  x: number;
  y: number;
  z: number;
};

export type RenderedTile = {
  coordinates: TileCoordinates;
  layerElements: Record<string, SVGElement>;
  // TODO: add update function which takes context and updates elements style attributes
};
