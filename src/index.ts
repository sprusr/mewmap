import { camera } from "./camera.js";
import { renderer } from "./renderer.js";
import { source } from "./source.js";
import { style } from "./style/index.js";
import type { MewMap, MewMapOptions } from "./types.js";
import { ui } from "./ui.js";

export const mewmap = (options: MewMapOptions): MewMap => {
  if (options.svg === null || options.svg.tagName !== "svg") {
    throw new Error("svg option must be an svg element");
  }

  const map: MewMap = {
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
    source: source(),
    style: style(),
    svg: options.svg as SVGSVGElement,
    renderer: renderer(),
    ui: ui(),
  };

  map.renderer.init(map);
  map.ui.init(map);

  return map;
};
