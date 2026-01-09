import type {
  Tile_Feature,
  Tile_Layer,
  Tile_Value,
} from "../../gen/vector_tile_pb.js";
import type { Expression } from "./types.js";

const getFeatureProperty = (
  layer: Tile_Layer,
  feature: Tile_Feature,
  property: string,
) => {
  const index = layer.keys.indexOf(property);
  if (index === -1) {
    return undefined;
  }
  for (let i = 0; i < feature.tags.length; i += 2) {
    if (feature.tags[i] === index) {
      const valueIndex = feature.tags[i + 1];
      if (valueIndex === undefined)
        throw new Error("Feature tag pair key did not have matching value");
      return layer.values[valueIndex];
    }
  }
  return undefined;
};

const getFeaturePropertyValue = (value: Tile_Value | undefined) => {
  if (!value) return undefined;
  if (Object.hasOwn(value, "stringValue")) return value.stringValue;
  if (Object.hasOwn(value, "uintValue")) return Number(value.uintValue);
  if (Object.hasOwn(value, "intValue")) return Number(value.intValue);
  if (Object.hasOwn(value, "sintValue")) return Number(value.sintValue);
  if (Object.hasOwn(value, "floatValue")) return value.floatValue;
  if (Object.hasOwn(value, "doubleValue")) return value.doubleValue;
  if (Object.hasOwn(value, "boolValue")) return value.boolValue;
  return undefined;
};

export const evaluate = (
  expression: Expression,
  context: {
    layer?: Tile_Layer;
    feature?: Tile_Feature;
  },
): boolean | string | number | unknown => {
  if (
    typeof expression === "string" ||
    typeof expression === "number" ||
    typeof expression === "boolean"
  ) {
    return expression;
  }

  if (expression[0] === "all") {
    return expression.slice(1).every((e) => evaluate(e, context));
  }

  if (expression[0] === "in") {
    if (typeof expression[1] === "string") {
      const value =
        context.layer !== undefined && context.feature !== undefined
          ? getFeaturePropertyValue(
              getFeatureProperty(context.layer, context.feature, expression[1]),
            )
          : undefined;
      return value !== undefined && expression.slice(2).includes(value);
    }
    return expression.slice(1).some((e) => evaluate(e, context));
  }

  if (expression[0] === "==") {
    const [left, right] = [expression[1], expression[2]];
    const leftValue = evaluate(left, context);
    const rightValue = evaluate(right, context);
    // biome-ignore lint/suspicious/noDoubleEquals: want loose equality
    return leftValue == rightValue;
  }

  if (expression[0] === "!=") {
    const [left, right] = [expression[1], expression[2]];
    const leftValue = evaluate(left, context);
    const rightValue = evaluate(right, context);
    // biome-ignore lint/suspicious/noDoubleEquals: want loose equality
    return leftValue != rightValue;
  }

  if (expression[0] === "has") {
    const key = expression[1];
    const value =
      context.layer !== undefined && context.feature !== undefined
        ? getFeaturePropertyValue(
            getFeatureProperty(context.layer, context.feature, key),
          )
        : undefined;
    return value !== undefined;
  }

  if (expression[0] === "!has") {
    const key = expression[1];
    const value =
      context.layer !== undefined && context.feature !== undefined
        ? getFeaturePropertyValue(
            getFeatureProperty(context.layer, context.feature, key),
          )
        : undefined;
    return value === undefined;
  }

  if (expression[0] === "boolean") {
    //
  }

  if (expression[0] === "string") {
    //
  }

  if (expression[0] === "number") {
    //
  }

  if (expression[0] === "array") {
    //
  }

  return expression;
};
