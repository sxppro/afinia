/**
 * For nicer hover types
 */
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

/**
 * Extracts a single type from an array type
 */
export type Unpacked<T> = T extends (infer U)[] ? U : T;

export type DateRange = {
  from: Date;
  to: Date;
};
