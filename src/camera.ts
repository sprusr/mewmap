import { MAX_TILE_Z, MAX_ZOOM, MIN_TILE_Z, VIEWBOX_SIZE } from "./constants.js";
import type { Camera, CameraOptions } from "./types.js";

export const camera = (options: CameraOptions): Camera => {
  let longitude = options.longitude ?? 0;
  let latitude = options.latitude ?? 0;
  let zoom = Math.min(MAX_ZOOM, options.zoom ?? 0);
  let z = Math.round(Math.min(MAX_TILE_Z, Math.max(MIN_TILE_Z, zoom)));
  let { x, y } = coordinatesToTile({ longitude, latitude, z });
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
    get z() {
      return z;
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
      zoom = Math.max(Math.min(MAX_ZOOM, position.zoom ?? zoom), 0);
      z = Math.round(Math.min(MAX_TILE_Z, Math.max(MIN_TILE_Z, zoom)));
      ({ x, y } = coordinatesToTile({ longitude, latitude, z }));
    },
    screenToTile(position) {
      const svgX = (position.x / screen.width) * viewBox.width + viewBox.x;
      const svgY = (position.y / screen.height) * viewBox.height + viewBox.y;
      const scale = 2 ** (zoom - z);
      return {
        x: svgX / VIEWBOX_SIZE / scale + x - 0.5 * scale,
        y: svgY / VIEWBOX_SIZE / scale + y - 0.5 * scale,
      };
    },
    tileToCoordinates(tile) {
      const n = 2 ** z; // number of tiles in each direction
      const longitude = (tile.x / n) * 360 - 180;
      const latitude =
        Math.atan(Math.sinh(Math.PI * (1 - (2 * tile.y) / n))) *
        (180 / Math.PI);
      return { longitude, latitude };
    },
    coordinatesToTile(coordinates) {
      return coordinatesToTile({ ...coordinates, z: coordinates.z ?? z });
    },
  };
};

const calculateViewBox = (screen: { width: number; height: number }) => {
  const width =
    screen.width > screen.height
      ? VIEWBOX_SIZE
      : (screen.width / screen.height) * VIEWBOX_SIZE;
  const height =
    screen.height > screen.width
      ? VIEWBOX_SIZE
      : (screen.height / screen.width) * VIEWBOX_SIZE;
  const x = width < VIEWBOX_SIZE ? (VIEWBOX_SIZE - width) / 2 : 0;
  const y = height < VIEWBOX_SIZE ? (VIEWBOX_SIZE - height) / 2 : 0;
  return { x, y, width, height };
};

const coordinatesToTile = ({
  longitude,
  latitude,
  z,
}: {
  longitude: number;
  latitude: number;
  z: number;
}): { x: number; y: number } => {
  const n = 2 ** z; // number of tiles in each direction
  const x = ((longitude + 180) / 360) * n;
  const latRad = (latitude * Math.PI) / 180;
  const y =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  return { x, y };
};
