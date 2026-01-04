import type { Camera, MewMap, MewMapOptions, Source, Style } from "./types.js";

type InternalMewMap = MewMap & {
  _renderAbort: AbortController | null;
  _render(): Promise<void>;
};

export const mewmap = (
  svg: SVGSVGElement,
  options: MewMapOptions = {},
): MewMap => {
  const camera: Camera = {
    longitude: options.center?.[0] ?? 0,
    latitude: options.center?.[1] ?? 0,
    zoom: options.zoom ?? 0,
  };
  const source: Source = {
    async getTile() {
      return {};
    },
  };
  const style: Style = {
    renderTile() {
      return document.createElementNS("http://www.w3.org/2000/svg", "g");
    },
  };
  const map: InternalMewMap = {
    camera,
    source,
    style,
    svg,
    _renderAbort: null,
    async _render() {
      const tile = await source.getTile(0, 0, 0);
      const element = style.renderTile(tile);
      this.svg.appendChild(element);
    },
  };
  void map._render();
  return map;
};
