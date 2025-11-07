import type { PaginatedResponse } from 'afinia-common/types/up-api/overrides';
import { createHmac } from 'crypto';
import { Resource } from 'sst';
import { RATE_LIMIT_HEADER } from './constants';

/**
 * Fetch from URL using Up API key
 * @param url
 * @returns
 */
export const fetchFromUp = async (url: string) =>
  await fetch(url, {
    headers: { Authorization: `Bearer ${Resource.UP_API_KEY.value}` },
  });

/**
 * Retrieves next page according to Up API pagination
 * and passes data to provided callback function
 * @see https://developer.up.com.au/#accounts
 * @param link next page link
 * @param onNextPage callback to do something with next page of data
 * @param page current page number
 */
export const getNextPage = async <T>(
  link: string,
  onNextPage: (data: T[], page: number) => Promise<void>,
  page: number
) => {
  const res = await fetchFromUp(link);

  /**
   * Track rate limit remaining (number of pages)
   */
  const rateLimitRemaining = res.headers.get(RATE_LIMIT_HEADER);
  if (rateLimitRemaining && parseInt(rateLimitRemaining, 10) === 0) {
    throw new Error('Rate limit exceeded');
  }

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
        error instanceof Error ? error.message : error
      }`
    );
  }

  if (data?.data) {
    await onNextPage(data.data, page);
  }

  if (data?.links?.next) {
    await getNextPage(data.links.next, onNextPage, page + 1);
  }
};

/**
 * Generates SHA256 HMAC of some string data
 * @param token secret key
 * @param string data to sign
 * @returns SHA256 HMAC of object
 */
export const signData = (token: string, data: string) =>
  createHmac('sha256', token).update(data).digest('hex');
