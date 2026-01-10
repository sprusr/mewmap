import { TILE_EXTENT } from "./constants.js";
import type { PreparedTile, Renderer, Source, Style } from "./types.js";
import { requestIdleCallback } from "./utils.js";

export const renderer = (): Renderer => {
  const renderedTileCache = new Map<string, SVGElement>();

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
      svg.style.background = style.background ?? "none";

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
          const tileElement = await renderTileCached({
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

const renderTileCached = async ({
  tile: { x, y, z },
  cache,
  source,
  style,
}: {
  tile: { x: number; y: number; z: number };
  source: Source;
  style: Style;
  cache: Map<string, SVGElement>;
}) => {
  const cached = cache.get(`${x}-${y}-${z}`);
  if (cached) {
    return cached;
  }
  const tile = await source.fetch(x, y, z);
  const preparedTile = style.prepare({ ...tile, x, y, z });
  const renderedTile = renderTile(preparedTile);
  cache.set(`${x}-${y}-${z}`, renderedTile);
  return renderedTile;
};

const renderTile = (tile: PreparedTile): SVGElement => {
  const element = document.createElementNS("http://www.w3.org/2000/svg", "g");

  for (const layer of Object.values(tile.layers)) {
    for (const feature of layer.features) {
      const path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path",
      );
      const d = feature.geometry.commands
        .map((command) => {
          switch (command.type) {
            case "move_to":
              return `m${command.x} ${command.y}`;
            case "line_to":
              return command.points
                .map((point) => `l${point.x} ${point.y}`)
                .join("");
            case "close_path":
              return "z";
            case "reset":
              return "M0 0";
            default:
              throw new Error("Unknown command type");
          }
        })
        .join("");
      path.setAttribute("d", d);
      path.setAttribute("fill", feature.static.fill ?? "none");
      path.setAttribute("stroke", feature.static.stroke ?? "none");
      path.setAttribute(
        "stroke-width",
        feature.static.strokeWidth?.toString() ?? "1",
      );
      path.setAttribute("opacity", feature.static.opacity?.toString() ?? "1");
      element.appendChild(path);
    }
  }

  return element;
};
