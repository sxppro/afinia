import createClient, { Middleware } from 'openapi-fetch';
import { paths } from '../../types/up-api';

/**
 * Create Up client with credentials
 */
export const createUpClient = (getApiKey: () => string): ReturnType<typeof createClient<paths>> => {
  const authMiddleware: Middleware = {
    onRequest: async ({ request}) => {
      const apiKey = getApiKey();
      if (!apiKey) {
        throw new Error('Up API key is not defined.');
      }

      request.headers.set('Authorization', `Bearer ${apiKey}`);
      return request;
    }
  }

  const client = createClient<paths>({
    baseUrl: 'https://api.up.com.au/api/v1',
  })
  client.use(authMiddleware)
  
  return client
}