import * as z from "zod/mini";
import type { PreparedFeatureValue } from "../../types.js";
import { expression, fn } from "../schema.js";

export type ResolvedLayer<
  T extends {
    paint?: Record<string, unknown> | undefined;
    layout?: Record<string, unknown> | undefined;
  },
> = {
  [K in keyof T]: K extends "paint" | "layout"
    ? {
        [J in keyof Exclude<T[K], undefined>]: PreparedFeatureValue<
          Exclude<
            Exclude<T[K], undefined>[J],
            z.output<typeof expression> | z.output<typeof fn> | undefined
          >
        >;
      }
    : T[K];
};

type SpecType<T extends z.core.$ZodType> = z.ZodMiniUnion<
  [T, typeof expression, typeof fn]
>;

/**
 * Given an object of Zod types for a layer's paint/layout, returns an optional
 * partial Zod object schema with types allowing also style expressions and
 * functions.
 */
export const layerProperties = <T extends Record<string, z.core.$ZodType>>(
  schema: T,
): z.ZodMiniOptional<
  z.ZodMiniObject<{
    [K in keyof T]: z.ZodMiniOptional<SpecType<T[K]>>;
  }>
> =>
  z.optional(
    z.partial(
      z.object(
        Object.fromEntries(
          Object.entries(schema).map(([key, value]) => [
            key,
            z.union([value, expression, fn]),
          ]),
        ),
      ),
    ),
    // biome-ignore lint/suspicious/noExplicitAny: complex types
  ) as any;
