import type { PaginatedResponse } from 'afinia-common/providers/up';
import { createHmac } from 'crypto';
import { Resource } from 'sst';
import { RATE_LIMIT_HEADER } from './constants';

/**
 * Check if rate limit is reached.
 * Up's rate limit header denotes number of requests remaining
 */
export const isRateLimitReached = (headers: Headers): boolean => {
  const remaining = headers.get(RATE_LIMIT_HEADER);
  return remaining !== null && parseInt(remaining, 10) === 0;
};

/**
 * Retrieves next page according to Up API pagination
 * and passes data to provided callback function.

 * Returns `{ complete: false }` when more pages were
 * available, but not fetched.
 * 
 * @see https://developer.up.com.au/#accounts
 * @param link - next page link
 * @param onNextPage - callback to do something with next page of data
 * @param page - current page number
 * @returns boolean indicating if all available pages were fetched
 */
export const getNextPage = async <T>(
  link: string,
  onNextPage: (data: T[], page: number) => Promise<unknown>,
  page: number = 1
): Promise<{ complete: boolean }> => {
  const res = await fetch(link, {
    headers: { Authorization: `Bearer ${Resource.UP_API_KEY.value}` },
  });

  if (!res.ok) {
    throw new Error(
      `Failed to fetch page ${page}: ${res.status} ${res.statusText} (${link})`
    );
  }

  let data: PaginatedResponse<T>;
  try {
    data = await res.json();
  } catch (error) {
    throw new Error(
      `Failed to parse JSON response for page ${page}: ${
        error instanceof Error ? error.message : JSON.stringify(error)
      }`
    );
  }

  if (data?.data) {
    await onNextPage(data.data, page);
  }

  const hasNext = Boolean(data?.links?.next);
  if (isRateLimitReached(res.headers) && hasNext) {
    console.warn(`Rate limit reached after page ${page}`);
    return { complete: false };
  }
  if (hasNext && data.links?.next) {
    return getNextPage(data.links.next, onNextPage, page + 1);
  }

  return { complete: true };
};

/**
 * Generates SHA256 HMAC of some string data
 * @param token secret key
 * @param string data to sign
 * @returns SHA256 HMAC of object
 */
export const signData = (token: string, data: string) =>
  createHmac('sha256', token).update(data).digest('hex');
