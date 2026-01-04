export type Camera = {
  longitude: number;
  latitude: number;
  zoom: number;
};

export type Tile = unknown;

export type Source = {
  getTile(x: number, y: number, z: number): Promise<Tile>;
};

export type Style = {
  renderTile(tile: Tile): SVGElement;
};

export type MewMapOptions = {
  center?: [number, number];
  zoom?: number;
};

export type MewMap = {
  camera: Camera;
  source: Source;
  style: Style;
  svg: SVGSVGElement;
};
