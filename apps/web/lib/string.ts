/**
 * Capitalise first letter of string
 * @param str
 * @returns
 */
export const capitalise = (str: string) =>
  str.charAt(0).toLocaleUpperCase() + str.slice(1).toLocaleLowerCase();
