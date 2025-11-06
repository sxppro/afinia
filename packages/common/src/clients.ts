import createClient, { Middleware } from 'openapi-fetch';
import { paths } from '../types/up-api';

const authMiddleware: Middleware = {
  async onRequest({ request }) {
    if (!process.env.UP_API_KEY) {
      throw new Error('UP_API_KEY is not defined. Please set it in .env');
    }

    request.headers.set('Authorization', `Bearer ${process.env.UP_API_KEY}`);
    return request;
  },
};

export const upClient = createClient<paths>({
  baseUrl: 'https://api.up.com.au/api/v1',
});

upClient.use(authMiddleware);
