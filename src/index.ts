import { camera } from "./camera.js";
import { source } from "./source.js";
import { style } from "./style.js";
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
    source: source(),
    style: style(),
    svg,
    async _render() {
      const tile = await this.source.getTile(582, 296, 10);
      const element = this.style.renderTile(tile);
      this.svg.setAttribute("viewBox", `0 0 4096 4096`);
      this.svg.appendChild(element);
    },
  };
  void map._render();
  return map;
};
