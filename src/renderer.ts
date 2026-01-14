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
  layerElements: Record<string, SVGElement>;
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
    init({ camera, source, style, svg, ui }) {
      svg.style.background = style.background ?? "none";

      const transformGroupElement = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "g",
      );

      for (const layer of style.layers) {
        const layerGroupElement = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "g",
        );
        layerGroupElement.setAttribute("id", `layer-${layer.name}`);
        transformGroupElement.appendChild(layerGroupElement);
      }

      svg.appendChild(transformGroupElement);

      // for tracking when to recalculate tile transforms
      let previousRoundedX: number | null = null;
      let previousRoundedY: number | null = null;
      let previousZ: number | null = null;

      const render = async () => {
        const cameraTransform = calculateTransformForCamera({ camera });
        transformGroupElement.setAttribute(
          "transform",
          `translate(${cameraTransform.x}, ${cameraTransform.y}) scale(${cameraTransform.scale})`,
        );

        const roundedX = Math.round(camera.x);
        const roundedY = Math.round(camera.y);

        if (
          previousRoundedX !== roundedX ||
          previousRoundedY !== roundedY ||
          previousZ !== camera.z
        ) {
          for (const {
            coordinates: { x, y, z },
            layerElements,
          } of visibleTiles) {
            const tileTransform = calculateTransformForTile({
              camera,
              tile: { x, y, z },
            });
            for (const element of Object.values(layerElements)) {
              element.setAttribute(
                "transform",
                `translate(${tileTransform.x}, ${tileTransform.y}) scale(${tileTransform.scale})`,
              );
            }
          }

          previousRoundedX = roundedX;
          previousRoundedY = roundedY;
          previousZ = camera.z;
        }

        requestAnimationFrame(render);
      };
      requestAnimationFrame(render);

      const idle = async () => {
        // proper idle scheduling not possible, wait until user stops interacting
        if (globalThis.requestIdleCallback === undefined && ui.interacting) {
          requestIdleCallback(idle);
          return;
        }

        const wantedTiles = calculateWantedTiles(camera, {
          expanded: true,
        });
        const { added, removed } = updateWantedTiles(wantedTiles);

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

          for (const [layerName, layerElement] of Object.entries(
            tile.layerElements,
          )) {
            layerElement.setAttribute(
              "transform",
              `translate(${transform.x}, ${transform.y}) scale(${transform.scale})`,
            );
            layerElement.setAttribute(
              "id",
              `layer-${layerName}-tile-${x}-${y}-${z}`,
            );
            document
              .getElementById(`layer-${layerName}`)
              ?.appendChild(layerElement);
          }

          visibleTiles.add(tile);
        }

        for (const { x, y, z } of removed) {
          const tile = tileCache.get(`${x}-${y}-${z}`);
          if (tile) {
            for (const element of Object.values(tile.layerElements)) {
              element.remove();
            }
            visibleTiles.delete(tile);
          }
        }

        requestIdleCallback(idle);
      };
      requestIdleCallback(idle);
    },
  };
};

const calculateWantedTiles = (
  camera: {
    x: number;
    y: number;
    z: number;
  },
  options?: { expanded?: boolean },
): { x: number; y: number; z: number }[] => {
  if (options?.expanded) {
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
  }

  const x = Math.round(camera.x),
    y = Math.round(camera.y),
    z = camera.z;
  return [
    { x, y, z },
    { x: x - 1, y, z },
    { x, y: y - 1, z },
    { x: x - 1, y: y - 1, z },
  ];
};

const calculateTransformForCamera = ({
  camera,
}: {
  camera: { x: number; y: number; z: number; zoom: number };
}) => {
  const scale = 2 ** (camera.zoom - camera.z);
  return {
    x:
      0 -
      (camera.x - Math.round(camera.x)) * TILE_EXTENT * scale +
      0.5 * TILE_EXTENT,
    y:
      0 -
      (camera.y - Math.round(camera.y)) * TILE_EXTENT * scale +
      0.5 * TILE_EXTENT,
    scale,
  };
};

const calculateTransformForTile = ({
  camera,
  tile,
}: {
  camera: {
    longitude: number;
    latitude: number;
    zoom: number;
    z: number;
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
  const scale = 2 ** (camera.z - tile.z);
  return {
    x: (tile.x * scale - Math.round(cameraX * scale)) * TILE_EXTENT,
    y: (tile.y * scale - Math.round(cameraY * scale)) * TILE_EXTENT,
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
    layerElements: renderTile(preparedTile),
  };
  cache.set(`${x}-${y}-${z}`, renderedTile);
  return renderedTile;
};

const renderTile = (tile: PreparedTile): Record<string, SVGElement> => {
  const layerElements: Record<string, SVGElement> = {};

  for (const layer of Object.values(tile.layers)) {
    const element = document.createElementNS("http://www.w3.org/2000/svg", "g");

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
      if (feature.static.opacity) {
        path.setAttribute("opacity", feature.static.opacity?.toString() ?? "1");
      }
      if (feature.static.fillTranslate) {
        path.setAttribute(
          "transform",
          `translate(${feature.static.fillTranslate.x} ${feature.static.fillTranslate.y})`,
        );
      }
      element.appendChild(path);
    }

    layerElements[layer.name] = element;
  }

  return layerElements;
};
