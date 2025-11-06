import { components } from './up-api';

export type TransactionResource =
  components['schemas']['TransactionResource'] & {
    attributes: components['schemas']['TransactionResource']['attributes'] & {
      deepLinkUrl?: string | null;
    };
  };
/**
 * Paginated API response with links
 */
export interface PaginatedResponse<T> {
  data: T[];
  links: {
    prev: string | null;
    next: string | null;
  };
}
