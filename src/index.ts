import type * as z from "zod/mini";
import { camera } from "./camera.js";
import { DEFAULT_STYLE_URL } from "./constants.js";
import { renderer } from "./renderer.js";
import { composite } from "./source/composite.js";
import { dummy as dummySource } from "./source/dummy.js";
import { raster } from "./source/raster.js";
import { vector } from "./source/vector.js";
import { dummy as dummyStyle } from "./style/dummy.js";
import { style } from "./style/index.js";
import { style as styleSchema } from "./style/schema.js";
import type { MewMap, MewMapOptions, Source } from "./types.js";
import { ui } from "./ui.js";

export const mewmap = (options: MewMapOptions): MewMap => {
  if (options.svg === null || options.svg.tagName !== "svg") {
    throw new Error("svg option must be an svg element");
  }

  const map = {
    camera: camera({
      ...options,
      screen: {
        width: options.svg.clientWidth,
        height: options.svg.clientHeight,
      },
    }),
    move(params) {
      this.camera.move(params);
    },
    source: dummySource(),
    style: dummyStyle(),
    svg: options.svg as SVGSVGElement,
    renderer: renderer(),
    ui: ui(),
    loaded: Promise.resolve(false),
  } satisfies MewMap;

  const init = async (): Promise<boolean> => {
    const styleSpec = await getStyleSpec(options.style);

    map.style = style(styleSpec);
    map.source = sourceFromStyleSpec(styleSpec);

    map.renderer.init(map);
    map.ui.init(map);

    return true;
  };

  map.loaded = init();

  return map;
};

const getStyleSpec = async (
  styleOption: MewMapOptions["style"],
): Promise<z.output<typeof styleSchema>> => {
  if (styleOption === undefined || typeof styleOption === "string") {
    const response = await fetch(styleOption ?? DEFAULT_STYLE_URL);
    const json = await response.json();
    const parsed = styleSchema.parse(json);

    // add satellite layer, remove vector layers which would look bad with it
    parsed.layers.splice(1, 0, {
      id: "orthophotos",
      type: "raster",
      source: "orthophotos",
    });
    parsed.layers = parsed.layers.filter(
      (l) =>
        l.type !== "fill" && !/^(land|water|site|airport|tunnel)-/.test(l.id),
    );
    parsed.sources["orthophotos"] = {
      type: "raster",
      tiles: [
        "https://versatiles-satellite.b-cdn.net/tiles/orthophotos/{z}/{x}/{y}",
      ],
      tileSize: 512,
      attribution: "© VersaTiles",
      maxzoom: 17,
    };

    return parsed;
  }
  return styleSchema.parse(styleOption);
};

const sourceFromStyleSpec = (
  styleSpec: z.output<typeof styleSchema>,
): Source => {
  const sources = Object.entries(styleSpec.sources).map(([name, source]) => {
    if (source.type === "vector") {
      return vector({ name });
    } else if (source.type === "raster") {
      return raster({ name });
    }
    return dummySource();
  });
  if (sources.length === 0) {
    return dummySource();
  }
  if (sources.length === 1 && sources[0]) {
    return sources[0];
  }
  return composite(...sources);
};
