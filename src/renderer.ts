import { TILE_EXTENT } from "./constants.js";
import type { Renderer, Source, Style } from "./types.js";

export const renderer = (): Renderer => {
  const renderedTileCache = new Map<string, SVGGElement>();

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
    init({ camera, source, style, svg }) {
      const render = async () => {
        const visibleTiles = getVisibleTiles(camera);

        for (const { x, y, z } of visibleTiles) {
          const transform = getTransformForTile({ camera, tile: { x, y, z } });
          renderedTileCache
            .get(`${x}-${y}-${z}`)
            ?.setAttribute(
              "transform",
              `translate(${transform.x}, ${transform.y}) scale(${transform.scale})`,
            );
        }

        requestAnimationFrame(render);
      };
      requestAnimationFrame(render);

      const idle = async () => {
        const visibleTiles = getVisibleTiles(camera);
        const { added, removed } = updateRenderedTiles(visibleTiles);

        const tileElements = [];

        for (const { x, y, z } of added) {
          const tileElement = await getCachedTileOrRender({
            tile: { x, y, z },
            cache: renderedTileCache,
            source,
            style,
          });

          tileElement.setAttribute("id", `tile-${x}-${y}-${z}`);
          const transform = getTransformForTile({ camera, tile: { x, y, z } });
          tileElement.setAttribute(
            "transform",
            `translate(${transform.x}, ${transform.y}) scale(${transform.scale})`,
          );
          tileElements.push(tileElement);
        }

        for (const { x, y, z } of removed) {
          svg.getElementById(`tile-${x}-${y}-${z}`)?.remove();
        }

        svg.append(...tileElements);

        requestIdleCallback(idle);
      };
      requestIdleCallback(idle);
    },
  };
};

const getVisibleTiles = (camera: {
  x: number;
  y: number;
  z: number;
}): { x: number; y: number; z: number }[] => {
  const x = Math.floor(camera.x),
    y = Math.floor(camera.y),
    z = camera.z;
  const visibleTiles = [];
  // produce a grid of 9 tiles with the center containing the camera's position
  for (let i = Math.max(x - 1, 0); i < Math.min(x + 2, 2 ** z); i++) {
    for (let j = Math.max(y - 1, 0); j < Math.min(y + 2, 2 ** z); j++) {
      visibleTiles.push({ x: i, y: j, z });
    }
  }
  return visibleTiles;
};

const getTransformForTile = ({
  camera,
  tile,
}: {
  camera: { x: number; y: number; zoom: number };
  tile: { x: number; y: number; z: number };
}) => {
  const scale = 2 ** (camera.zoom - tile.z);
  return {
    x: (tile.x + 0.5 / scale - camera.x) * TILE_EXTENT * scale,
    y: (tile.y + 0.5 / scale - camera.y) * TILE_EXTENT * scale,
    scale,
  };
};

const getCachedTileOrRender = async ({
  tile: { x, y, z },
  cache,
  source,
  style,
}: {
  tile: { x: number; y: number; z: number };
  source: Source;
  style: Style;
  cache: Map<string, SVGGElement>;
}) => {
  const cached = cache.get(`${x}-${y}-${z}`);
  if (cached) {
    return cached;
  }
  const tileData = await source.getTile(x, y, z);
  const tileElement = style.renderTile(tileData);
  cache.set(`${x}-${y}-${z}`, tileElement);
  return tileElement;
};
