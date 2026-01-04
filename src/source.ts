import { fromBinary } from "@bufbuild/protobuf";
import { TileSchema } from "./gen/vector_tile_pb.js";
import type { Source } from "./types.js";

const TILES_URL = "https://tiles.versatiles.org/tiles/osm/{z}/{x}/{y}";

export const fetchTile = async (
  tilesUrl: string,
  x: number,
  y: number,
  z: number,
) => {
  const url = tilesUrl
    .replace("{x}", x.toString())
    .replace("{y}", y.toString())
    .replace("{z}", z.toString());
  const response = await fetch(url);
  const bytes = await response.bytes();
  return bytes;
};

export const parseTile = (bytes: Uint8Array) => {
  const tile = fromBinary(TileSchema, bytes);
  return tile;
};

export const source = (): Source => {
  return {
    async getTile(x, y, z) {
      const bytes = await fetchTile(TILES_URL, x, y, z);
      const tile = parseTile(bytes);
      return tile;
    },
  };
};
