export type AllExpression = readonly ["all", ...BooleanExpression[]];

export type InExpression = readonly [
  "in",
  BooleanExpression | StringExpression | NumberExpression,
  ...StringExpression[],
];

export type EqualsExpression = readonly ["==", Expression, Expression];

export type BooleanExpression =
  | AllExpression
  | InExpression
  | EqualsExpression
  | ["boolean", unknown]
  | boolean;
export type StringExpression = ["string", unknown] | string;
export type NumberExpression = ["number", unknown] | number;
export type ArrayExpression = ["array", unknown]; // | unknown[]

export type Expression =
  | BooleanExpression
  | StringExpression
  | NumberExpression
  | ArrayExpression;
