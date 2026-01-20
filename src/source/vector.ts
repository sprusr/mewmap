import { fromBinary } from "@bufbuild/protobuf";
import { TileSchema } from "../gen/vector_tile_pb.js";
import type { Source, Tile } from "../types.js";

const TILES_URL = "https://tiles.versatiles.org/tiles/osm/{z}/{x}/{y}";

const fetchTile = async (tilesUrl: string, x: number, y: number, z: number) => {
  try {
    const url = tilesUrl
      .replace("{x}", x.toString())
      .replace("{y}", y.toString())
      .replace("{z}", z.toString());
    const response = await fetch(url);
    const bytes = await response.bytes();
    return bytes;
  } catch {
    return null;
  }
};

const parseTile = (bytes: Uint8Array) => {
  try {
    const tile = fromBinary(TileSchema, bytes);
    return tile;
  } catch {
    return null;
  }
};

export const vector = ({ name: sourceName }: { name: string }): Source => {
  const tileCache = new Map<string, Extract<Tile, { type: "vector" }>>();

  return {
    async fetch({ name, tile: { x, y, z } }) {
      if (name !== sourceName) return null;

      const cached = tileCache.get(`${x}-${y}-${z}`);
      if (cached) return cached;

      const bytes = await fetchTile(TILES_URL, x, y, z);
      if (!bytes) return null;

      const tileData = parseTile(bytes);
      if (!tileData) return null;

      const tile = { type: "vector" as const, ...tileData, x, y, z };

      tileCache.set(`${x}-${y}-${z}`, tile);

      return tile;
    },
  };
};
