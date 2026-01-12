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
   * Project the given longitude and latitude to xy tile coordinates at the
   * current zoom level, or provided tile z coordinate.
   */
  coordinatesToTile(coordinates: {
    longitude: number;
    latitude: number;
    z?: number;
  }): {
    x: number;
    y: number;
  };
};

export type Source = {
  fetch(x: number, y: number, z: number): Promise<Tile>;
};

type PreparedFeatureGeometryCommand =
  | { type: "move_to"; x: number; y: number }
  | { type: "line_to"; points: Array<{ x: number; y: number }> }
  | { type: "close_path" }
  | { type: "reset" };

export type PreparedFeatureGeometry = {
  type: "point" | "linestring" | "polygon";
  commands: Array<PreparedFeatureGeometryCommand>;
};

export type PreparedFeatureStyle = {
  fill: string | undefined;
  stroke: string | undefined;
  strokeWidth: number | undefined;
  opacity: number | undefined;
};

export type PreparedFeature = {
  geometry: PreparedFeatureGeometry;
  /** Style properties which do not change based on state. */
  static: Partial<PreparedFeatureStyle>;
  /** Returns style properties which change based on map and feature state. */
  dynamic?: (params: {
    zoom: number;
    /** Feature state */
    state: Record<string, unknown>;
  }) => Partial<PreparedFeatureStyle>;
};

export type PreparedLayer = {
  name: string;
  features: Array<PreparedFeature>;
};

export type PreparedTile = {
  layers: Record<string, PreparedLayer>;
};

export type Style = {
  readonly background: string | null;
  readonly layers: { name: string }[];
  prepare(tile: Tile & { x: number; y: number; z: number }): PreparedTile;
};

export type Renderer = {
  init(params: {
    camera: Camera;
    source: Source;
    style: Style;
    svg: SVGSVGElement;
    ui: UI;
  }): void;
};

export type UI = {
  readonly interacting: boolean;
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
