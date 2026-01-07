import { camera } from "./camera.js";
import { renderer } from "./renderer.js";
import { source } from "./source.js";
import { style } from "./style/index.js";
import type { MewMap, MewMapOptions } from "./types.js";
import { viewBoxForSvg } from "./utils.js";

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
      void this.renderer.render(this);
    },
    source: source(),
    style: style(),
    svg: options.svg as SVGSVGElement,
    renderer: renderer(),
  };

  addEventListeners(map);

  void map.renderer.render(map);

  return map;
};

const addEventListeners = (map: MewMap) => {
  new ResizeObserver(([entry]) => {
    if (!entry?.borderBoxSize[0]) return;
    map.camera.resize({
      width: entry.borderBoxSize[0].inlineSize,
      height: entry.borderBoxSize[0].blockSize,
    });
    map.svg.setAttribute("viewBox", viewBoxForSvg(map.camera.viewBox));
  }).observe(map.svg);

  let pointerdown = false;
  map.svg.addEventListener("pointerdown", () => {
    pointerdown = true;
  });
  document.addEventListener("pointerup", () => {
    pointerdown = false;
  });
  document.addEventListener("pointermove", (event) => {
    if (!pointerdown) return;
    const { x: previousX, y: previousY } = map.camera.screenToTile({
      x: event.offsetX - event.movementX,
      y: event.offsetY - event.movementY,
    });
    const { x, y } = map.camera.screenToTile({
      x: event.offsetX,
      y: event.offsetY,
    });
    const { longitude, latitude } = map.camera.tileToCoordinates({
      x: map.camera.x + previousX - x,
      y: map.camera.y + previousY - y,
    });
    map.move({ longitude, latitude });
  });
};
