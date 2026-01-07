import { TILE_EXTENT } from "./constants.js";
import type { Renderer } from "./types.js";
import { viewBoxForSvg } from "./utils.js";

export const renderer = (): Renderer => {
  return {
    async render({ camera, source, style, svg }) {
      const visibleTiles = getVisibleTiles(camera);
      const z = Math.round(camera.zoom);

      const gs = [];
      for (const [x, y] of visibleTiles) {
        const tile = await source.getTile(x, y, z);
        const g = style.renderTile(tile);
        g.setAttribute("id", `tile-${x}-${y}-${z}`);
        const offset = getOffsetForTile({ camera, tile: { x, y } });
        g.setAttribute("transform", `translate(${offset.x}, ${offset.y})`);
        gs.push(g);
      }

      svg.replaceChildren(...gs);
      svg.setAttribute("viewBox", viewBoxForSvg(camera.viewBox));
    },
  };
};

const getVisibleTiles = (camera: {
  x: number;
  y: number;
}): [number, number][] => {
  const [topLeftTileX, topLeftTileY] = [camera.x - 0.5, camera.y - 0.5];
  const visibleTiles: [number, number][] = [
    [Math.floor(topLeftTileX), Math.floor(topLeftTileY)],
  ];
  if (!Number.isInteger(topLeftTileX)) {
    visibleTiles.push([Math.ceil(topLeftTileX), Math.floor(topLeftTileY)]);
  }
  if (!Number.isInteger(topLeftTileY)) {
    visibleTiles.push([Math.floor(topLeftTileX), Math.ceil(topLeftTileY)]);
  }
  if (visibleTiles.length === 3) {
    visibleTiles.push([Math.ceil(topLeftTileX), Math.ceil(topLeftTileY)]);
  }
  return visibleTiles;
};

const getOffsetForTile = ({
  camera,
  tile,
}: {
  camera: { x: number; y: number };
  tile: { x: number; y: number };
}) => ({
  x: (tile.x + 0.5 - camera.x) * TILE_EXTENT,
  y: (tile.y + 0.5 - camera.y) * TILE_EXTENT,
});
