import { z } from "zod/mini";

export const fn = z.unknown();

export const filter = z.unknown();

export const expression = z.array(z.unknown());

export const vectorSource = z
  .object({
    attribution: z.optional(z.string()),
    bounds: z.optional(
      z.tuple([z.number(), z.number(), z.number(), z.number()]),
    ),
    extra_bounds: z.optional(
      z.array(z.tuple([z.number(), z.number(), z.number(), z.number()])),
    ),
    maxzoom: z.optional(z.number()),
    minzoom: z.optional(z.number()),
    promoteId: z.optional(z.unknown()),
    scheme: z.optional(z.enum(["xyz", "tms"])),
    tiles: z.optional(z.array(z.string())),
    type: z.literal("vector"),
    url: z.optional(z.string()),
    volatile: z.optional(z.boolean()),
  })
  .check(
    z.refine((value) => value.tiles !== undefined || value.url !== undefined, {
      error:
        "At least one of `tiles` or `url` must be provided for a vector source",
    }),
  );

export const rasterSource = z
  .object({
    attribution: z.optional(z.string()),
    bounds: z.optional(
      z.tuple([z.number(), z.number(), z.number(), z.number()]),
    ),
    extra_bounds: z.optional(
      z.array(z.tuple([z.number(), z.number(), z.number(), z.number()])),
    ),
    maxzoom: z.optional(z.number()),
    minzoom: z.optional(z.number()),
    scheme: z.optional(z.enum(["xyz", "tms"])),
    tiles: z.optional(z.array(z.string())),
    tileSize: z.optional(z.number()),
    type: z.literal("raster"),
    url: z.optional(z.string()),
    volatile: z.optional(z.boolean()),
  })
  .check(
    z.refine((value) => value.tiles !== undefined || value.url !== undefined, {
      error:
        "At least one of `tiles` or `url` must be provided for a raster source",
    }),
  );

export const geojsonSource = z.object({
  attribution: z.optional(z.string()),
  buffer: z.optional(z.number().check(z.gte(0), z.lte(512))),
  cluster: z.optional(z.boolean()),
  clusterMaxZoom: z.optional(z.number()),
  clusterMinPoints: z.optional(z.number()),
  clusterProperties: z.optional(z.unknown()),
  clusterRadius: z.optional(z.number().check(z.positive())),
  data: z.union([z.string(), z.unknown()]), // geojson schema needed
  dynamic: z.optional(z.boolean()),
  filter: z.optional(z.union([expression, filter])),
  generateId: z.optional(z.boolean()),
  lineMetrics: z.optional(z.boolean()),
  maxzoom: z.optional(z.number()),
  minzoom: z.optional(z.number()),
  promoteId: z.optional(z.unknown()),
  tolerance: z.optional(z.number()),
});

export const source = z.discriminatedUnion("type", [
  vectorSource,
  rasterSource,
  geojsonSource,
]);

const layerBase = z.object({
  id: z.string(),
  appearances: z.optional(z.unknown()),
  filter: z.optional(z.union([expression, filter])),
  maxzoom: z.optional(z.number()),
  metadata: z.optional(z.unknown()),
  minzoom: z.optional(z.number()),
  slot: z.optional(z.string()),
});

export const backgroundLayer = z.extend(layerBase, {
  type: z.literal("background"),
  paint: z.optional(
    z.partial(
      z.object({
        "background-color": z.string(),
        "background-emissive-strength": z.number(),
        "background-opacity": z.number().check(z.gte(0), z.lte(1)),
        "background-pattern": z.string(),
        "background-pitch-alignment": z.enum(["map", "viewport"]),
      }),
    ),
  ),
  layout: z.optional(
    z.partial(
      z.object({
        visibility: z.enum(["visible", "none"]),
      }),
    ),
  ),
});

export const circleLayer = z.extend(layerBase, {
  type: z.literal("circle"),
  source: z.string(),
  "source-layer": z.optional(z.string()),
  paint: z.optional(
    z.object({
      "circle-color": z.string(),
      "circle-radius": z.number(),
    }),
  ),
});

export const fillLayer = z.extend(layerBase, {
  type: z.literal("fill"),
  source: z.string(),
  "source-layer": z.optional(z.string()),
  paint: z.optional(
    z.partial(
      z.object({
        "fill-antialias": z.boolean(),
        "fill-color": z.string(),
        "fill-emissive-strength": z.number().check(z.positive()),
        "fill-opacity": z.union([
          z.number().check(z.gte(0), z.lte(1)),
          expression,
          fn,
        ]),
        "fill-outline-color": z.string(),
        "fill-pattern": z.string(),
        "fill-pattern-cross-fade": z.number().check(z.gte(0), z.lte(1)),
        "fill-translate": z.tuple([z.number(), z.number()]),
        "fill-translate-anchor": z.enum(["map", "viewport"]),
        "fill-z-offset": z.number().check(z.positive()),
      }),
    ),
  ),
  layout: z.optional(
    z.partial(
      z.object({
        "fill-sort-key": z.number(),
        visibility: z.enum(["visible", "none"]),
      }),
    ),
  ),
});

export const lineLayer = z.extend(layerBase, {
  type: z.literal("line"),
  source: z.string(),
  "source-layer": z.optional(z.string()),
  paint: z.optional(
    z.partial(
      z.object({
        "line-blur": z.number().check(z.positive()),
        "line-color": z.string(),
        "line-dasharray": z.array(z.number().check(z.positive())),
        "line-emissive-strength": z.number().check(z.positive()),
        "line-gap-width": z.number().check(z.positive()),
        "line-gradient": z.unknown(),
        "line-occlusion-opacity": z.number().check(z.gte(0), z.lte(1)),
        "line-offset": z.number(),
        "line-opacity": z.union([
          z.number().check(z.gte(0), z.lte(1)),
          expression,
          fn,
        ]),
        "line-pattern": z.string(),
        "line-pattern-cross-fade": z.number().check(z.gte(0), z.lte(1)),
        "line-translate": z.tuple([z.number(), z.number()]),
        "line-translate-anchor": z.enum(["map", "viewport"]),
        "line-trim-color": z.string(),
        "line-trim-fade-range": z.tuple([
          z.number().check(z.gte(0), z.lte(1)),
          z.number().check(z.gte(0), z.lte(1)),
        ]),
        "line-trim-offset": z.tuple([
          z.number().check(z.gte(0), z.lte(1)),
          z.number().check(z.gte(0), z.lte(1)),
        ]),
        "line-width": z.union([z.number().check(z.positive()), expression, fn]),
      }),
    ),
  ),
  layout: z.optional(
    z.partial(
      z.object({
        "line-cap": z.enum(["butt", "round", "square"]),
        "line-cross-slope": z.number(),
        "line-elevation-reference": z.enum([
          "none",
          "sea",
          "ground",
          "hd-road-markup",
        ]),
        "line-join": z.enum(["bevel", "round", "miter", "none"]),
        "line-miter-limit": z.number(),
        "line-round-limit": z.number(),
        "line-sort-key": z.number(),
        "line-z-offset": z.number(),
        visibility: z.enum(["visible", "none"]),
      }),
    ),
  ),
});

export const rasterLayer = z.extend(layerBase, {
  type: z.literal("raster"),
  source: z.string(),
  paint: z.optional(
    z.partial(
      z.object({
        "raster-array-band": z.string(),
        "raster-brightness-max": z.number().check(z.gte(0), z.lte(1)),
        "raster-brightness-min": z.number().check(z.gte(0), z.lte(1)),
        "raster-color": z.unknown(),
        "raster-color-mix": z.tuple([
          z.number(),
          z.number(),
          z.number(),
          z.number(),
        ]),
        "raster-color-range": z.unknown(),
        "raster-contrast": z.number().check(z.gte(-1), z.lte(1)),
        "raster-elevation": z.number().check(z.positive()),
        "raster-emissive-strength": z.number().check(z.positive()),
        "raster-fade-duration": z.number().check(z.positive()),
        "raster-hue-rotate": z.number(),
        "raster-opacity": z.number().check(z.gte(0), z.lte(1)),
        "raster-resampling": z.enum(["linear", "nearest"]),
        "raster-saturation": z.number().check(z.gte(-1), z.lte(1)),
      }),
    ),
  ),
  layout: z.optional(
    z.partial(
      z.object({
        visibility: z.enum(["visible", "none"]),
      }),
    ),
  ),
});

export const symbolLayer = z.extend(layerBase, {
  type: z.literal("symbol"),
  source: z.string(),
  "source-layer": z.optional(z.string()),
  layout: z.optional(z.unknown()),
  paint: z.optional(z.unknown()),
});

export const layer = z.discriminatedUnion("type", [
  backgroundLayer,
  circleLayer,
  fillLayer,
  lineLayer,
  rasterLayer,
  symbolLayer,
]);

export const style = z.object({
  version: z.literal(8),
  name: z.string(),
  metadata: z.optional(z.unknown()),
  glyphs: z.string(),
  sprite: z.array(z.object({ id: z.string(), url: z.string() })),
  sources: z.record(z.string(), source),
  layers: z.array(layer),
});
