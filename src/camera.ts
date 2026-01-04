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
