import { TILE_EXTENT } from "./constants.js";
import type { Renderer } from "./types.js";
import { viewBoxForSvg } from "./utils.js";

export const renderer = (): Renderer => {
  let renderedTiles: { x: number; y: number; z: number }[] = [];

  const updateRenderedTiles = (
    tiles: { x: number; y: number; z: number }[],
  ): {
    added: { x: number; y: number; z: number }[];
    removed: { x: number; y: number; z: number }[];
  } => {
    const added = tiles.filter(
      (tile) =>
        !renderedTiles.find(
          (renderedTile) =>
            tile.x === renderedTile.x &&
            tile.y === renderedTile.y &&
            tile.z === renderedTile.z,
        ),
    );
    const removed = renderedTiles.filter(
      (renderedTile) =>
        !tiles.find(
          (tile) =>
            tile.x === renderedTile.x &&
            tile.y === renderedTile.y &&
            tile.z === renderedTile.z,
        ),
    );
    renderedTiles = tiles;
    return { added, removed };
  };

  return {
    async render({ camera, source, style, svg }) {
      const visibleTiles = getVisibleTiles(camera);
      const { added, removed } = updateRenderedTiles(visibleTiles);

      const gs = [];
      for (const { x, y, z } of added) {
        const tile = await source.getTile(x, y, z);
        const g = style.renderTile(tile);
        g.setAttribute("id", `tile-${x}-${y}-${z}`);
        const offset = getOffsetForTile({ camera, tile: { x, y } });
        g.setAttribute("transform", `translate(${offset.x}, ${offset.y})`);
        gs.push(g);
      }

      for (const { x, y, z } of removed) {
        svg.getElementById(`tile-${x}-${y}-${z}`)?.remove();
      }

      for (const { x, y, z } of visibleTiles) {
        const offset = getOffsetForTile({ camera, tile: { x, y } });
        svg
          .getElementById(`tile-${x}-${y}-${z}`)
          ?.setAttribute("transform", `translate(${offset.x}, ${offset.y})`);
      }

      svg.append(...gs);
      svg.setAttribute("viewBox", viewBoxForSvg(camera.viewBox));
    },
  };
};

const getVisibleTiles = (camera: {
  x: number;
  y: number;
  zoom: number;
}): { x: number; y: number; z: number }[] => {
  const x = Math.floor(camera.x),
    y = Math.floor(camera.y),
    z = camera.zoom;
  const visibleTiles = [];
  for (let i = Math.max(x - 1, 0); i < Math.min(x + 2, 2 ** z); i++) {
    for (let j = Math.max(y - 1, 0); j < Math.min(y + 2, 2 ** z); j++) {
      visibleTiles.push({ x: i, y: j, z });
    }
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
