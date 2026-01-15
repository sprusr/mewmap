import { fromBinary } from "@bufbuild/protobuf";
import { type Tile, TileSchema } from "../gen/vector_tile_pb.js";
import type { Source } from "../types.js";

const TILES_URL = "https://tiles.versatiles.org/tiles/osm/{z}/{x}/{y}";

const fetchTile = async (tilesUrl: string, x: number, y: number, z: number) => {
  const url = tilesUrl
    .replace("{x}", x.toString())
    .replace("{y}", y.toString())
    .replace("{z}", z.toString());
  const response = await fetch(url);
  const bytes = await response.bytes();
  return bytes;
};

const parseTile = (bytes: Uint8Array) => {
  const tile = fromBinary(TileSchema, bytes);
  return tile;
};

export const vector = ({ name: sourceName }: { name: string }): Source => {
  const tileCache = new Map<string, { type: "vector" } & Tile>();

  return {
    get name() {
      return sourceName;
    },
    async fetch({ name, tile: { x, y, z } }) {
      if (name !== sourceName) return null;

      const cached = tileCache.get(`${x}-${y}-${z}`);
      if (cached) return cached;

      const bytes = await fetchTile(TILES_URL, x, y, z);
      const tile = { type: "vector" as const, ...parseTile(bytes) };

      tileCache.set(`${x}-${y}-${z}`, tile);

      return tile;
    },
  };
};
