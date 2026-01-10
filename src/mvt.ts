import { type Tile_Feature, Tile_GeomType } from "./gen/vector_tile_pb.js";
import type { PreparedFeatureGeometry } from "./types.js";

type Command = {
  nextAt: number | null;
  type: "moveTo" | "lineTo" | "closePath";
  params: [number, number][];
};

const getCommandType = (
  commandInteger: number,
): "moveTo" | "lineTo" | "closePath" => {
  const type = commandInteger & 0x7;
  switch (type) {
    case 1:
      return "moveTo";
    case 2:
      return "lineTo";
    case 7:
      return "closePath";
    default:
      throw new Error(`Unknown command type: ${type}`);
  }
};

const getCommandAt = (geometry: number[], at: number): Command => {
  const commandInteger = geometry[at];
  if (!commandInteger) throw new Error("Tried to get command out of bounds");
  const type = getCommandType(commandInteger);
  if (type === "closePath") {
    const nextAt = at + 1;
    return {
      nextAt: nextAt >= geometry.length ? null : nextAt,
      type,
      params: [],
    };
  }
  const count = commandInteger >> 3;
  const params: [number, number][] = [];
  for (let i = 0; i < count; i++) {
    const xParameterInteger = geometry[at + i * 2 + 1];
    const yParameterInteger = geometry[at + i * 2 + 2];
    if (xParameterInteger === undefined || yParameterInteger === undefined) {
      throw new Error("Invalid geometry data: params undefined");
    }
    const x = (xParameterInteger >> 1) ^ -(xParameterInteger & 1);
    const y = (yParameterInteger >> 1) ^ -(yParameterInteger & 1);
    params.push([x, y]);
  }

  const nextAt = at + count * 2 + 1;
  return {
    nextAt: nextAt >= geometry.length ? null : nextAt,
    type,
    params,
  };
};

export const decodeGeometry = (
  feature: Tile_Feature,
): PreparedFeatureGeometry | null => {
  if (feature.type === Tile_GeomType.UNKNOWN) {
    return null;
  }

  if (feature.type === Tile_GeomType.POINT) {
    // TODO: implement drawing points, I guess just return array of points
    return null;
  }

  const geometry: PreparedFeatureGeometry = {
    type: feature.type === Tile_GeomType.LINESTRING ? "linestring" : "polygon",
    commands: [],
  };

  let cursorX = 0;
  let cursorY = 0;

  let nextAt: number | null = 0;
  while (nextAt !== null) {
    const command = getCommandAt(feature.geometry, nextAt);
    nextAt = command.nextAt;

    switch (command.type) {
      case "moveTo":
        for (const [x, y] of command.params) {
          geometry.commands.push({ type: "move_to", x, y });
          cursorX = 0;
          cursorY = 0;
        }
        break;
      case "lineTo":
        geometry.commands.push({
          type: "line_to",
          points: command.params.map(([x, y]) => {
            cursorX += x;
            cursorY += y;
            return { x, y };
          }),
        });
        break;
      case "closePath":
        geometry.commands.push({ type: "close_path" });
        // mvt geometry does not move cursor when closing path, but our
        // close_path command does
        geometry.commands.push({ type: "move_to", x: cursorX, y: cursorY });
        cursorX = 0;
        cursorY = 0;
        break;
    }
  }

  return geometry;
};
