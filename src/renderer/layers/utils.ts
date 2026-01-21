import type { PreparedFeatureGeometry } from "../../types.js";

export const getResolvedValue = <T>(
  value:
    | { type: "constant"; value: T }
    | { type: "dynamic"; value: () => T }
    | undefined,
): T | undefined => {
  if (value?.type === "constant") return value.value;
  if (value?.type === "dynamic") return value.value();
  return undefined;
};

export const getSvgPathD = (geometry: PreparedFeatureGeometry) =>
  geometry.commands
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
