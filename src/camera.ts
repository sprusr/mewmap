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
  const tileCoordinates = coordinatesToTile(
    longitude,
    latitude,
    Math.round(zoom),
  );
  const [topLeftTileX, topLeftTileY] = [
    tileCoordinates[0] - 0.5,
    tileCoordinates[1] - 0.5,
  ];
  const visibleTiles: [number, number][] = [
    [Math.floor(topLeftTileX), Math.floor(topLeftTileY)],
  ];
  if (!Number.isInteger(topLeftTileX)) {
    visibleTiles.push([Math.ceil(topLeftTileX), Math.floor(topLeftTileY)]);
  }
  if (!Number.isInteger(topLeftTileY)) {
    visibleTiles.push([Math.floor(topLeftTileX), Math.ceil(topLeftTileY)]);
  }
  if (visibleTiles.length === 3) {
    visibleTiles.push([Math.ceil(topLeftTileX), Math.ceil(topLeftTileY)]);
  }
  return visibleTiles;
};

export const getOffsetForTile = (
  x: number,
  y: number,
  zoom: number,
  longitude: number,
  latitude: number,
): [number, number] => {
  const tileCoordinates = coordinatesToTile(
    longitude,
    latitude,
    Math.round(zoom),
  );

  const resX = (x + 0.5 - tileCoordinates[0]) * 4096;
  const resY = (y + 0.5 - tileCoordinates[1]) * 4096;

  return [resX, resY];
};
