import type { SearchParam } from './types';

export const stringParam = (param?: SearchParam) =>
  typeof param === 'string' ? param.trim() : undefined;

export const booleanParam = (param?: SearchParam) =>
  typeof param === 'string'
    ? param === 'true'
      ? true
      : param === 'false'
        ? false
        : undefined
    : undefined;
