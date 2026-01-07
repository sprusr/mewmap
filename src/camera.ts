import type { Camera, CameraOptions } from "./types.js";

export const camera = (options: CameraOptions = {}): Camera => {
  let longitude = options.longitude ?? 0;
  let latitude = options.latitude ?? 0;
  let zoom = options.zoom ?? 0;
  let [x, y] = coordinatesToTile(longitude, latitude, zoom);

  const move = (position: {
    longitude?: number;
    latitude?: number;
    zoom?: number;
  }): void => {
    longitude = position.longitude ?? longitude;
    latitude = position.latitude ?? latitude;
    zoom = position.zoom ?? zoom;
    [x, y] = coordinatesToTile(longitude, latitude, zoom);
  };

  return {
    get longitude() {
      return longitude;
    },
    get latitude() {
      return latitude;
    },
    get zoom() {
      return zoom;
    },
    get x() {
      return x;
    },
    get y() {
      return y;
    },
    move,
    screenToCoordinates() {
      return [0, 0];
    },
    coordinatesToScreen() {
      return [0, 0];
    },
  };
};

export const calculateViewBox = (clientWidth: number, clientHeight: number) => {
  const width =
    clientWidth > clientHeight ? 4096 : (clientWidth / clientHeight) * 4096;
  const height =
    clientHeight > clientWidth ? 4096 : (clientHeight / clientWidth) * 4096;
  const x = width < 4096 ? (4096 - width) / 2 : 0;
  const y = height < 4096 ? (4096 - height) / 2 : 0;
  return `${x} ${y} ${width} ${height}`;
};

export const screenToTile = (
  screen: { x: number; y: number; width: number; height: number },
  viewBox: { x: number; y: number; width: number; height: number },
  center: { longitude: number; latitude: number },
  zoom: number,
): [number, number] => {
  const svgX = (screen.x / screen.width) * viewBox.width + viewBox.x;
  const svgY = (screen.y / screen.height) * viewBox.height + viewBox.y;
  const [centerTileX, centerTileY] = coordinatesToTile(
    center.longitude,
    center.latitude,
    zoom,
  );
  const x = svgX / 4096 + centerTileX - 0.5;
  const y = svgY / 4096 + centerTileY - 0.5;
  return [x, y];
};

export const tileToCoordinates = (
  tileX: number,
  tileY: number,
  zoom: number,
): [number, number] => {
  const n = 2 ** zoom; // number of tiles in each direction
  const x = (tileX / n) * 360 - 180;
  const y =
    Math.atan(Math.sinh(Math.PI * (1 - (2 * tileY) / n))) * (180 / Math.PI);
  return [x, y];
};

const coordinatesToTile = (
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
