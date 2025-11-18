/**
 * Extracts a single type from an array type
 */
export type Unpacked<T> = T extends (infer U)[] ? U : T;
