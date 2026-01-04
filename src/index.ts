import { camera, getOffsetForTile, getVisibleTiles } from "./camera.js";
import { source } from "./source.js";
import { style } from "./style/index.js";

import type { MewMap, MewMapOptions } from "./types.js";

type InternalMewMap = MewMap & {
  _render(): Promise<void>;
};

export const mewmap = (
  svg: SVGSVGElement,
  options: MewMapOptions = {},
): MewMap => {
  const map: InternalMewMap = {
    camera: camera(options),
    move({ longitude, latitude, zoom }) {
      if (longitude !== undefined) {
        this.camera.longitude = longitude;
      }
      if (latitude !== undefined) {
        this.camera.latitude = latitude;
      }
      if (zoom !== undefined) {
        this.camera.zoom = zoom;
      }
      void this._render();
    },
    source: source(),
    style: style(),
    svg,
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

      this.svg.setAttribute("viewBox", `0 0 4096 4096`);
      this.svg.replaceChildren(...gs);
    },
  };
  void map._render();
  return map;
};
