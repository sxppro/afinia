import { createUpClient } from 'afinia-common/providers/up';

if (!process.env.UP_API_KEY) {
  throw new Error('Up API key not provided');
}

export const upClient = createUpClient(() => process.env.UP_API_KEY!);
