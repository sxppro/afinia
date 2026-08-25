import { isMatch } from 'date-fns';
import type { SearchParam } from './types';

export const stringParam = (param?: SearchParam) => {
  const value = Array.isArray(param) ? param.at(0) : param;
  const trimmed = value?.trim();
  return trimmed || undefined;
};

export const booleanParam = (param?: SearchParam) => {
  const value = stringParam(param);
  return value
    ? value === 'true'
      ? true
      : value === 'false'
        ? false
        : undefined
    : undefined;
};

export const dateParam = (param?: SearchParam) => {
  const value = stringParam(param);
  return value && isMatch(value, 'yyyy-MM-dd') ? value : undefined;
};
