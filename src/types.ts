import type { Tile } from "./gen/vector_tile_pb.js";

export type CameraOptions = {
  center?: [number, number];
  zoom?: number;
};

export type Camera = {
  longitude: number;
  latitude: number;
  zoom: number;
  x: number;
  y: number;
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

export type MewMapOptions = CameraOptions;

export type MewMap = {
  camera: Camera;
  source: Source;
  style: Style;
  svg: SVGSVGElement;
  move(position: {
    longitude?: number;
    latitude?: number;
    zoom?: number;
  }): void;
};
