import * as z from "zod/mini";
import { expression, fn } from "./schema.js";

const resolvedType = <T extends z.core.$ZodType>(schema: T) =>
  z.union([
    z.object({ type: z.literal("constant"), schema }),
    z.object({
      type: z.literal("dynamic"),
      value: z.function({ output: schema }),
    }),
  ]);

export const resolvedLayer = <
  T extends z.ZodMiniObject<{
    paint: z.ZodMiniObject;
    layout: z.ZodMiniObject;
  }>,
>(
  schema: T,
): z.ZodMiniObject<{
  [k in keyof T["shape"]]: T["shape"][k] extends z.core.$ZodType
    ? k extends "paint" | "layout"
      ? z.ZodMiniOptional<
          z.ZodMiniObject<{
            [j in keyof T["shape"][k]["shape"]]: T["shape"][k]["shape"][j] extends z.core.$ZodType
              ? z.ZodMiniOptional<
                  z.ZodMiniUnion<
                    [
                      z.ZodMiniObject<{
                        type: z.ZodMiniLiteral<"constant">;
                        value: T["shape"][k]["shape"][j];
                      }>,
                      z.ZodMiniObject<{
                        type: z.ZodMiniLiteral<"dynamic">;
                        value: z.ZodMiniFunction<
                          z.ZodMiniNever,
                          T["shape"][k]["shape"][j]
                        >;
                      }>,
                    ]
                  >
                >
              : never;
          }>
        >
      : T["shape"][k]
    : never;
}> =>
  z.extend(schema, {
    paint: z.optional(
      z.partial(
        z.object(
          Object.fromEntries(
            Object.entries(schema.shape.paint.shape).map(([key, value]) => [
              key,
              resolvedType(value),
            ]),
          ),
        ),
      ),
    ),
    layout: z.optional(
      z.partial(
        z.object(
          Object.fromEntries(
            Object.entries(schema.shape.layout.shape).map(([key, value]) => [
              key,
              resolvedType(value),
            ]),
          ),
        ),
      ),
    ),
    // biome-ignore lint/suspicious/noExplicitAny: complex types
  }) as any;

const specType = <T extends z.core.$ZodType>(schema: T) =>
  z.union([schema, expression, fn]);

export const specLayer = <
  T extends z.ZodMiniObject<{
    paint: z.ZodMiniObject;
    layout: z.ZodMiniObject;
  }>,
>(
  schema: T,
): z.ZodMiniObject<{
  [k in keyof T["shape"]]: T["shape"][k] extends z.core.$ZodType
    ? k extends "paint" | "layout"
      ? z.ZodMiniOptional<
          z.ZodMiniObject<{
            [j in keyof T["shape"][k]["shape"]]: T["shape"][k]["shape"][j] extends z.core.$ZodType
              ? z.ZodMiniOptional<
                  z.ZodMiniUnion<
                    [T["shape"][k]["shape"][j], typeof expression, typeof fn]
                  >
                >
              : never;
          }>
        >
      : T["shape"][k]
    : never;
}> =>
  z.extend(schema, {
    paint: z.optional(
      z.partial(
        z.object(
          Object.fromEntries(
            Object.entries(schema.shape.paint.shape).map(([key, value]) => [
              key,
              specType(value),
            ]),
          ),
        ),
      ),
    ),
    layout: z.optional(
      z.partial(
        z.object(
          Object.fromEntries(
            Object.entries(schema.shape.layout.shape).map(([key, value]) => [
              key,
              specType(value),
            ]),
          ),
        ),
      ),
    ),
    // biome-ignore lint/suspicious/noExplicitAny: complex types
  }) as any;
