import { createUpClient } from 'afinia-common/providers/up';
import { Resource } from 'sst';

export const upClient = createUpClient(() => Resource.UP_API_KEY.value);
