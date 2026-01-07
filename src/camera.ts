import { TILE_EXTENT } from "./constants.js";
import type { Camera, CameraOptions } from "./types.js";

export const camera = (options: CameraOptions): Camera => {
  let longitude = options.longitude ?? 0;
  let latitude = options.latitude ?? 0;
  let zoom = options.zoom ?? 0;
  let { x, y } = coordinatesToTile({ longitude, latitude, zoom });
  let screen = options.screen;
  let viewBox = calculateViewBox(screen);

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
    get screen() {
      return screen;
    },
    get viewBox() {
      return viewBox;
    },
    resize({ width, height }) {
      screen = { width, height };
      viewBox = calculateViewBox(screen);
    },
    move(position) {
      longitude = position.longitude ?? longitude;
      latitude = position.latitude ?? latitude;
      zoom = position.zoom ?? zoom;
      ({ x, y } = coordinatesToTile({ longitude, latitude, zoom }));
    },
    screenToTile(position) {
      const svgX = (position.x / screen.width) * viewBox.width + viewBox.x;
      const svgY = (position.y / screen.height) * viewBox.height + viewBox.y;
      return {
        x: svgX / TILE_EXTENT + x - 0.5,
        y: svgY / TILE_EXTENT + y - 0.5,
      };
    },
    tileToCoordinates(tile) {
      const n = 2 ** zoom; // number of tiles in each direction
      const longitude = (tile.x / n) * 360 - 180;
      const latitude =
        Math.atan(Math.sinh(Math.PI * (1 - (2 * tile.y) / n))) *
        (180 / Math.PI);
      return { longitude, latitude };
    },
    coordinatesToTile(coordinates) {
      return coordinatesToTile({ ...coordinates, zoom });
    },
  };
};

const calculateViewBox = (screen: { width: number; height: number }) => {
  const width =
    screen.width > screen.height
      ? TILE_EXTENT
      : (screen.width / screen.height) * TILE_EXTENT;
  const height =
    screen.height > screen.width
      ? TILE_EXTENT
      : (screen.height / screen.width) * TILE_EXTENT;
  const x = width < TILE_EXTENT ? (TILE_EXTENT - width) / 2 : 0;
  const y = height < TILE_EXTENT ? (TILE_EXTENT - height) / 2 : 0;
  return { x, y, width, height };
};

const coordinatesToTile = ({
  longitude,
  latitude,
  zoom,
}: {
  longitude: number;
  latitude: number;
  zoom: number;
}): { x: number; y: number } => {
  const n = 2 ** zoom; // number of tiles in each direction
  const x = ((longitude + 180) / 360) * n;
  const latRad = (latitude * Math.PI) / 180;
  const y =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  return { x, y };
};
