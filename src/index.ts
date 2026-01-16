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
import type { MewMap, MewMapOptions } from "./types.js";
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
    if (options.style === undefined || typeof options.style === "string") {
      const response = await fetch(options.style ?? DEFAULT_STYLE_URL);
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

      map.style = style(parsed);
      map.source = composite(
        vector({ name: "versatiles-shortbread" }),
        raster({ name: "orthophotos" }),
      );
    } else {
      map.style = style(options.style);
      map.source = composite(
        vector({ name: "versatiles-shortbread" }),
        raster({ name: "orthophotos" }),
      );
    }

    map.renderer.init(map);
    map.ui.init(map);

    return true;
  };

  map.loaded = init();

  return map;
};
