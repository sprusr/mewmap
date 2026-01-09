export type AllExpression = readonly ["all", ...BooleanExpression[]];

export type InExpression = readonly [
  "in",
  BooleanExpression | StringExpression | NumberExpression,
  ...StringExpression[],
];

export type EqualsExpression = readonly ["==", Expression, Expression];

export type NotEqualsExpression = readonly ["!=", Expression, Expression];

export type HasExpression = readonly ["has", string];

export type NotHasExpression = readonly ["!has", string];

export type BooleanExpression =
  | AllExpression
  | InExpression
  | EqualsExpression
  | NotEqualsExpression
  | HasExpression
  | NotHasExpression
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
