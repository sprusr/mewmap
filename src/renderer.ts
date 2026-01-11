import { TILE_EXTENT } from "./constants.js";
import type { PreparedTile, Renderer, Source, Style } from "./types.js";
import { requestIdleCallback } from "./utils.js";

type TileCoordinates = {
  x: number;
  y: number;
  z: number;
};

type RenderedTile = {
  coordinates: TileCoordinates;
  element: SVGElement;
};

export const renderer = (): Renderer => {
  const tileCache = new Map<`${number}-${number}-${number}`, RenderedTile>();
  const visibleTiles = new Set<RenderedTile>();

  let wantedTiles: TileCoordinates[] = [];

  const updateWantedTiles = (
    tiles: TileCoordinates[],
  ): {
    added: TileCoordinates[];
    removed: TileCoordinates[];
  } => {
    const added = tiles.filter(
      (tile) =>
        !wantedTiles.find(
          (renderedTile) =>
            tile.x === renderedTile.x &&
            tile.y === renderedTile.y &&
            tile.z === renderedTile.z,
        ),
    );
    const removed = wantedTiles.filter(
      (renderedTile) =>
        !tiles.find(
          (tile) =>
            tile.x === renderedTile.x &&
            tile.y === renderedTile.y &&
            tile.z === renderedTile.z,
        ),
    );
    wantedTiles = tiles;
    return { added, removed };
  };

  return {
    init({ camera, source, style, svg }) {
      svg.style.background = style.background ?? "none";

      const render = async () => {
        for (const {
          coordinates: { x, y, z },
          element,
        } of visibleTiles) {
          const transform = calculateTransformForTile({
            camera,
            tile: { x, y, z },
          });
          element.setAttribute(
            "transform",
            `translate(${transform.x}, ${transform.y}) scale(${transform.scale})`,
          );
        }

        requestAnimationFrame(render);
      };
      requestAnimationFrame(render);

      const idle = async () => {
        const wantedTiles = calculateWantedTiles(camera);
        const { added, removed } = updateWantedTiles(wantedTiles);

        const addedElements = [];

        for (const { x, y, z } of added) {
          const tile = await renderTileCached({
            tile: { x, y, z },
            cache: tileCache,
            source,
            style,
          });

          const transform = calculateTransformForTile({
            camera,
            tile: { x, y, z },
          });

          tile.element.setAttribute(
            "transform",
            `translate(${transform.x}, ${transform.y}) scale(${transform.scale})`,
          );
          tile.element.setAttribute("id", `tile-${x}-${y}-${z}`);

          visibleTiles.add(tile);
          addedElements.push(tile.element);
        }

        svg.append(...addedElements);

        for (const { x, y, z } of removed) {
          const tile = tileCache.get(`${x}-${y}-${z}`);
          if (tile) {
            tile.element.remove();
            visibleTiles.delete(tile);
          }
        }

        requestIdleCallback(idle);
      };
      requestIdleCallback(idle);
    },
  };
};

const calculateWantedTiles = (camera: {
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

const calculateTransformForTile = ({
  camera,
  tile,
}: {
  camera: {
    longitude: number;
    latitude: number;
    zoom: number;
    coordinatesToTile: (coordinates: {
      longitude: number;
      latitude: number;
      z: number;
    }) => { x: number; y: number };
  };
  tile: { x: number; y: number; z: number };
}) => {
  const { x: cameraX, y: cameraY } = camera.coordinatesToTile({
    ...camera,
    ...tile,
  });
  const scale = 2 ** (camera.zoom - tile.z);
  return {
    x: (tile.x * scale + 0.5 - cameraX * scale) * TILE_EXTENT,
    y: (tile.y * scale + 0.5 - cameraY * scale) * TILE_EXTENT,
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
  cache: Map<string, RenderedTile>;
}): Promise<RenderedTile> => {
  const cached = cache.get(`${x}-${y}-${z}`);
  if (cached) {
    return cached;
  }
  const tile = await source.fetch(x, y, z);
  const preparedTile = style.prepare({ ...tile, x, y, z });
  const renderedTile = {
    coordinates: { x, y, z },
    element: renderTile(preparedTile),
  };
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

      path.setAttribute("data-layername", layer.name);

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
