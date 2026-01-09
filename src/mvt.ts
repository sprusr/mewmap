import { type Tile_Feature, Tile_GeomType } from "./gen/vector_tile_pb.js";

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

export const decodeGeometry = (feature: Tile_Feature): string | null => {
  if (feature.type === Tile_GeomType.UNKNOWN) {
    return null;
  }

  if (feature.type === Tile_GeomType.POINT) {
    // TODO: implement drawing points, I guess just return array of points
    return null;
  }

  let cursorX = 0;
  let cursorY = 0;
  const svgCommands: string[] = [];

  let nextAt: number | null = 0;
  while (nextAt !== null) {
    const command = getCommandAt(feature.geometry, nextAt);
    nextAt = command.nextAt;

    switch (command.type) {
      case "moveTo":
        for (const [x, y] of command.params) {
          svgCommands.push(`m ${x},${y}`);
          cursorX += x;
          cursorY += y;
        }
        break;
      case "lineTo":
        svgCommands.push("l");
        for (const [x, y] of command.params) {
          svgCommands.push(`${x},${y}`);
          cursorX += x;
          cursorY += y;
        }
        break;
      case "closePath":
        svgCommands.push("z");
        svgCommands.push(`M ${cursorX},${cursorY}`);
        break;
    }
  }

  return svgCommands.join(" ");
};
