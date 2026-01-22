import { TILE_EXTENT } from "../constants.js";
import type { Renderer } from "../types.js";
import { requestIdleCallback } from "../utils.js";
import { render as renderTile } from "./tile.js";
import type { RenderedTile, TileCoordinates } from "./types.js";

export const renderer = (): Renderer => {
  const tileCache = new Map<
    `${number}-${number}-${number}`,
    RenderedTile | null
  >();
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

  let animating = false;
  let transformGroupElement: SVGElement | null = null;

  return {
    init(map) {
      animating = true;

      map.svg.style.background = map.style.background ?? "none";

      transformGroupElement = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "g",
      );

      for (const layer of map.style.layers) {
        const layerGroupElement = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "g",
        );
        layerGroupElement.setAttribute("id", `layer-${layer.name}`);
        transformGroupElement.appendChild(layerGroupElement);
      }

      map.svg.appendChild(transformGroupElement);

      // for tracking when to recalculate tile transforms
      let previousRoundedX: number | null = null;
      let previousRoundedY: number | null = null;
      let previousZ: number | null = null;

      const render = async () => {
        if (!animating) return;

        const cameraTransform = calculateTransformForCamera({
          camera: map.camera,
        });
        transformGroupElement?.setAttribute(
          "transform",
          `translate(${cameraTransform.x}, ${cameraTransform.y}) scale(${cameraTransform.scale})`,
        );

        const roundedX = Math.round(map.camera.x);
        const roundedY = Math.round(map.camera.y);

        if (
          previousRoundedX !== roundedX ||
          previousRoundedY !== roundedY ||
          previousZ !== map.camera.z
        ) {
          for (const {
            coordinates: { x, y, z },
            layerElements,
          } of visibleTiles) {
            const tileTransform = calculateTransformForTile({
              camera: map.camera,
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
          previousZ = map.camera.z;
        }

        requestAnimationFrame(render);
      };
      requestAnimationFrame(render);

      const idle = async () => {
        if (!animating) return;

        // proper idle scheduling not possible, wait until user stops interacting
        if (
          globalThis.requestIdleCallback === undefined &&
          map.ui.interacting
        ) {
          requestIdleCallback(idle);
          return;
        }

        const wantedTiles = calculateWantedTiles(map.camera, {
          expanded: true,
        });
        const { added, removed } = updateWantedTiles(wantedTiles);

        for (const { x, y, z } of added) {
          const tile = await renderTile({
            tile: { x, y, z },
            cache: tileCache,
            source: map.source,
            style: map.style,
          });

          if (!tile) {
            continue;
          }

          const transform = calculateTransformForTile({
            camera: map.camera,
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
    destroy() {
      animating = false;
      tileCache.clear();
      visibleTiles.clear();
      wantedTiles = [];
      transformGroupElement?.remove();
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
