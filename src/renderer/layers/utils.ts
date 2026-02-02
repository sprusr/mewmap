import type {
  PreparedFeatureContext,
  PreparedFeatureGeometry,
  PreparedFeatureValue,
} from "../../types.js";

export const featureValueResolver = () => {
  const repaintFunctions: Array<(context: PreparedFeatureContext) => void> = [];

  const resolve = <T extends PreparedFeatureValue<unknown>>(
    value: T,
    resolveFunction: (value: Extract<T, { type: "constant" }>["value"]) => void,
    defaultValue?: Extract<T, { type: "constant" }>["value"],
  ) => {
    if (value?.type === "dynamic") {
      return repaintFunctions.push((context) =>
        resolveFunction(value.value(context)),
      );
    }
    if (value?.type === "constant") {
      return resolveFunction(value.value);
    }
    if (defaultValue !== undefined) {
      return resolveFunction(defaultValue);
    }
  };

  return {
    resolve,
    get repaint() {
      return repaintFunctions.length
        ? (context: PreparedFeatureContext) => {
            for (const fn of repaintFunctions) {
              fn(context);
            }
          }
        : null;
    },
  };
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
