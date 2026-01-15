import { camera } from "./camera.js";
import { DEFAULT_STYLE_URL } from "./constants.js";
import { renderer } from "./renderer.js";
import { dummy as dummySource } from "./source/dummy.js";
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

      map.style = style(parsed);
      map.source = vector({ name: "versatiles-shortbread" });
    } else {
      map.style = style(options.style);
      map.source = vector({ name: "versatiles-shortbread" });
    }

    map.renderer.init(map);
    map.ui.init(map);

    return true;
  };

  map.loaded = init();

  return map;
};
