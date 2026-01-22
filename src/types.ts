import type * as z from "zod/mini";
import type { Tile as VectorTile } from "./gen/vector_tile_pb.js";
import type {
  ResolvedCircleLayer,
  ResolvedFillLayer,
  ResolvedLineLayer,
  ResolvedRasterLayer,
  ResolvedSymbolLayer,
  style as styleSchema,
} from "./style/schema.js";

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

export type Tile =
  | ({ type: "vector" } & VectorTile)
  | { type: "raster"; url: string };

export type Source = {
  fetch(params: {
    /**
     * Name of the source from which to fetch the tile. Compared against
     * source's own name, or used to determine which other source to use in the
     * case of e.g. a composite source.
     */
    name: string;
    tile: { x: number; y: number; z: number };
  }): Promise<Tile | null>;
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

export type PreparedFeatureContext = {
  zoom: number;
};

export type PreparedFeatureValue<T> =
  | {
      type: "constant";
      value: T;
    }
  | {
      type: "dynamic";
      value: (context: PreparedFeatureContext) => T;
    }
  | undefined;

export type PreparedFeature<T extends { paint?: unknown; layout?: unknown }> = {
  geometry: PreparedFeatureGeometry;
  paint?: T["paint"];
  layout?: T["layout"];
};

export type PreparedLayer =
  | {
      type: "circle";
      name: string;
      features: Array<PreparedFeature<ResolvedCircleLayer>>;
      paint?: ResolvedCircleLayer["paint"];
      layout?: ResolvedCircleLayer["layout"];
    }
  | {
      type: "fill";
      name: string;
      features: Array<PreparedFeature<ResolvedFillLayer>>;
      paint?: ResolvedFillLayer["paint"];
      layout?: ResolvedFillLayer["layout"];
    }
  | {
      type: "line";
      name: string;
      features: Array<PreparedFeature<ResolvedLineLayer>>;
      paint?: ResolvedLineLayer["paint"];
      layout?: ResolvedLineLayer["layout"];
    }
  | {
      type: "raster";
      name: string;
      url: string;
      paint?: ResolvedRasterLayer["paint"];
      layout?: ResolvedRasterLayer["layout"];
    }
  | {
      type: "symbol";
      name: string;
      features: Array<PreparedFeature<ResolvedSymbolLayer>>;
      paint?: ResolvedSymbolLayer["paint"];
      layout?: ResolvedSymbolLayer["layout"];
    };

export type PreparedTile = {
  layers: Record<string, PreparedLayer>;
};

export type Style = {
  readonly background: string | null;
  readonly layers: { name: string }[];
  prepare(params: {
    source: Source;
    tile: { x: number; y: number; z: number };
  }): Promise<PreparedTile>;
};

export type Renderer = {
  init(params: {
    camera: Camera;
    source: Source;
    style: Style;
    svg: SVGSVGElement;
    ui: UI;
  }): void;
  destroy(): void;
};

export type UI = {
  readonly interacting: boolean;
  init(params: { camera: Camera; svg: SVGSVGElement }): void;
  destroy(): void;
};

export type MewMapOptions = {
  longitude?: number;
  latitude?: number;
  zoom?: number;
  style?: string | z.input<typeof styleSchema>;
  svg: Element | null;
};

export type MewMap = {
  readonly camera: Camera;
  readonly source: Source;
  readonly style: Style;
  readonly svg: SVGSVGElement;
  readonly renderer: Renderer;
  readonly ui: UI;
  /**
   * Promise which resolves when the map has finished loading. A resolved value
   * of false indicates that there was an error loading the map.
   */
  readonly loaded: Promise<boolean>;
  move(position: {
    longitude?: number;
    latitude?: number;
    zoom?: number;
  }): void;
  setStyle(style: string | z.input<typeof styleSchema>): Promise<void>;
};
