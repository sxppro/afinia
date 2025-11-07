import { paths } from 'afinia-common/types/up-api';
import createClient, { Middleware } from 'openapi-fetch';
import { Resource } from 'sst';

const authMiddleware: Middleware = {
  async onRequest({ request }) {
    if (!Resource.UP_API_KEY.value) {
      throw new Error(
        'Up API key is not defined. Please set it in .env and run load-env'
      );
    }

    request.headers.set('Authorization', `Bearer ${process.env.UP_API_KEY}`);
    return request;
  },
};

export const upClient = createClient<paths>({
  baseUrl: 'https://api.up.com.au/api/v1',
});

upClient.use(authMiddleware);
