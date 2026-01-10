import type { Tile } from "./gen/vector_tile_pb.js";

export type CameraOptions = {
  longitude?: number;
  latitude?: number;
  zoom?: number;
  screen: { width: number; height: number };
};

export type Camera = {
  readonly longitude: number;
  readonly latitude: number;
  /** The zoom level of the camera in tile coordinates. */
  readonly zoom: number;
  /** The x-coordinate of the camera's position in tile coordinates. */
  readonly x: number;
  /** The y-coordinate of the camera's position in tile coordinates. */
  readonly y: number;
  /**
   * The tile z-coordinate which is currently visible - `zoom` rounded to
   * integer by some logic.
   */
  readonly z: number;
  /** Dimensions of the containing element on the page, a.k.a. the "screen". */
  readonly screen: { width: number; height: number };
  /**
   * The bounding box of the camera's view in ~tile coordinates~ SVG
   * coordinates.
   */
  readonly viewBox: { x: number; y: number; width: number; height: number };
  /** To be called when the containing element changes size. */
  resize(screen: { width: number; height: number }): void;
  /** Change the position of the camera. */
  move(position: {
    longitude?: number;
    latitude?: number;
    zoom?: number;
  }): void;
  /**
   * Given a position on the screen (page pixels, relative to the containing
   * element), return the tile coordinates of what is rendered at that position.
   */
  screenToTile(position: { x: number; y: number }): { x: number; y: number };
  /**
   * Unproject the given tile coordinates at the current zoom level to longitude
   * and latitude.
   */
  tileToCoordinates(tile: { x: number; y: number }): {
    longitude: number;
    latitude: number;
  };
  /**
   * Project the given longitude and latitude to tile coordinates at the current
   * zoom level.
   */
  coordinatesToTile(coordinates: { longitude: number; latitude: number }): {
    x: number;
    y: number;
  };
};

export type Source = {
  getTile(x: number, y: number, z: number): Promise<Tile>;
};

export type Style = {
  renderTile(tile: Tile & { x: number; y: number; z: number }): SVGElement;
};

export type Renderer = {
  init(params: {
    camera: Camera;
    source: Source;
    style: Style;
    svg: SVGSVGElement;
  }): void;
};

export type UI = {
  init(params: { camera: Camera; svg: SVGSVGElement }): void;
};

export type MewMapOptions = {
  longitude?: number;
  latitude?: number;
  zoom?: number;
  svg: Element | null;
};

export type MewMap = {
  readonly camera: Camera;
  readonly source: Source;
  readonly style: Style;
  readonly svg: SVGSVGElement;
  readonly renderer: Renderer;
  readonly ui: UI;
  move(position: {
    longitude?: number;
    latitude?: number;
    zoom?: number;
  }): void;
};
