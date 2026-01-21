import { create } from "@bufbuild/protobuf";
import { describe, expect, it } from "vitest";
import { Tile_FeatureSchema } from "../../gen/vector_tile_pb";
import { decodeGeometry } from "./mvt";

describe("mvt parser", () => {
  it("should parse all geometry commands from a line feature", () => {
    const feature = create(Tile_FeatureSchema, {
      tags: [0, 0, 7, 1, 9, 0, 1, 0, 3, 1, 4, 1, 5, 0, 6, 0, 8, 26, 2, 4],
      geometry: [9, 944, 1996, 10, 3, 67],
      type: 2,
    });
    const decoded = decodeGeometry(feature);
    expect(decoded).toEqual({
      type: "linestring",
      commands: [
        { type: "move_to", x: 472, y: 998 },
        { type: "line_to", points: [{ x: -2, y: -34 }] },
      ],
    });
  });
});
