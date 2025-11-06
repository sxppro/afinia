import type { PaginatedResponse } from 'afinia-common/types/up-api/overrides';
import { createHmac } from 'crypto';
import { RATE_LIMIT_HEADER } from './constants';

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
  const res = await fetch(link, {
    headers: { Authorization: `Bearer ${process.env.UP_API_KEY}` },
  });

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
        error instanceof Error ? error.message : String(error)
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
 * Generates SHA256 HMAC of an object
 * @param token secret key
 * @param body object to be signed
 * @returns SHA256 HMAC of object
 */
export const signRequestBody = (token: string, body: any) =>
  createHmac('sha256', token).update(JSON.stringify(body)).digest('hex');
