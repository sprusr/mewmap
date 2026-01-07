import {
  calculateViewBox,
  camera,
  getOffsetForTile,
  getVisibleTiles,
  screenToTile,
  tileToCoordinates,
} from "./camera.js";
import { source } from "./source.js";
import { style } from "./style/index.js";

import type { MewMap, MewMapOptions } from "./types.js";

type InternalMewMap = MewMap & {
  _render(): Promise<void>;
};

export const mewmap = (options: MewMapOptions): MewMap => {
  if (options.svg === null || options.svg.tagName !== "svg") {
    throw new Error("svg option must be an svg element");
  }

  const map: InternalMewMap = {
    camera: camera(options),
    move(params) {
      this.camera.move(params);
      void this._render();
    },
    source: source(),
    style: style(),
    svg: options.svg as SVGSVGElement,
    async _render() {
      const visibleTiles = getVisibleTiles(
        this.camera.longitude,
        this.camera.latitude,
        this.camera.zoom,
      );
      const z = Math.round(this.camera.zoom);

      const gs = [];
      for (const [x, y] of visibleTiles) {
        const tile = await this.source.getTile(x, y, z);
        const g = this.style.renderTile(tile);
        g.setAttribute("id", `tile-${x}-${y}-${z}`);
        const offset = getOffsetForTile(
          x,
          y,
          z,
          this.camera.longitude,
          this.camera.latitude,
        );
        g.setAttribute("transform", `translate(${offset[0]}, ${offset[1]})`);
        gs.push(g);
      }

      this.svg.replaceChildren(...gs);

      this.svg.setAttribute(
        "viewBox",
        calculateViewBox(this.svg.clientWidth, this.svg.clientHeight),
      );
    },
  };

  addEventListeners(map);

  void map._render();

  return map;
};

const addEventListeners = (map: InternalMewMap) => {
  new ResizeObserver(([entry]) => {
    if (!entry?.borderBoxSize[0]) return;
    map.svg.setAttribute(
      "viewBox",
      calculateViewBox(
        entry.borderBoxSize[0].inlineSize,
        entry.borderBoxSize[0].blockSize,
      ),
    );
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
    const [previousX, previousY] = screenToTile(
      {
        x: event.offsetX - event.movementX,
        y: event.offsetY - event.movementY,
        width: map.svg.clientWidth,
        height: map.svg.clientHeight,
      },
      map.svg.viewBox.baseVal,
      map.camera,
      map.camera.zoom,
    );
    const [x, y] = screenToTile(
      {
        x: event.offsetX,
        y: event.offsetY,
        width: map.svg.clientWidth,
        height: map.svg.clientHeight,
      },
      map.svg.viewBox.baseVal,
      map.camera,
      map.camera.zoom,
    );
    const [longitude, latitude] = tileToCoordinates(
      map.camera.x + previousX - x,
      map.camera.y + previousY - y,
      map.camera.zoom,
    );
    map.move({ longitude, latitude });
  });
};
