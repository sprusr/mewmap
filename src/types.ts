import type { Tile } from "./gen/vector_tile_pb.js";

export type CameraOptions = {
  longitude?: number;
  latitude?: number;
  zoom?: number;
};

export type Camera = {
  readonly longitude: number;
  readonly latitude: number;
  readonly zoom: number;
  readonly x: number;
  readonly y: number;
  move(position: {
    longitude?: number;
    latitude?: number;
    zoom?: number;
  }): void;
  screenToCoordinates(x: number, y: number): [number, number];
  coordinatesToScreen(longitude: number, latitude: number): [number, number];
};

export type Source = {
  getTile(x: number, y: number, z: number): Promise<Tile>;
};

export type Style = {
  renderTile(tile: Tile): SVGGElement;
};

export type MewMapOptions = CameraOptions & { svg: Element | null };

export type MewMap = {
  readonly camera: Camera;
  readonly source: Source;
  readonly style: Style;
  readonly svg: SVGSVGElement;
  move(position: {
    longitude?: number;
    latitude?: number;
    zoom?: number;
  }): void;
};
