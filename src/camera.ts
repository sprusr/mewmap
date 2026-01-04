import type { Camera, CameraOptions } from "./types.js";

export const camera = (options: CameraOptions = {}): Camera => {
  return {
    longitude: options.center?.[0] ?? 0,
    latitude: options.center?.[1] ?? 0,
    zoom: options.zoom ?? 0,
    screenToCoordinates() {
      return [0, 0];
    },
    coordinatesToScreen() {
      return [0, 0];
    },
  };
};

export const coordinatesToTile = (
  longitude: number,
  latitude: number,
  zoom: number,
): [number, number] => {
  const n = 2 ** zoom; // number of tiles in each direction
  const x = ((longitude + 180) / 360) * n;
  const latRad = (latitude * Math.PI) / 180;
  const y =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  return [x, y];
};

export const getVisibleTiles = (
  longitude: number,
  latitude: number,
  zoom: number,
): [number, number][] => {
  const tileCoordinates = coordinatesToTile(longitude, latitude, zoom);
  const visibleTiles: [number, number][] = [
    [Math.floor(tileCoordinates[0]), Math.floor(tileCoordinates[1])],
  ];
  if (!Number.isInteger(tileCoordinates[0] - 0.5)) {
    visibleTiles.push([
      Math.ceil(tileCoordinates[0]),
      Math.floor(tileCoordinates[1]),
    ]);
  }
  if (!Number.isInteger(tileCoordinates[1] - 0.5)) {
    visibleTiles.push([
      Math.floor(tileCoordinates[0]),
      Math.ceil(tileCoordinates[1]),
    ]);
  }
  if (visibleTiles.length === 3) {
    visibleTiles.push([
      Math.ceil(tileCoordinates[0]),
      Math.ceil(tileCoordinates[1]),
    ]);
  }
  return visibleTiles;
};
