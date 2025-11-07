import { components, WebhookEventTypeEnum } from 'afinia-common/types/up-api';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { Resource } from 'sst';
import { ALERT_LEVEL, AUTHENTICITY_HEADER } from '../utils/constants';
import { signRequestBody } from '../utils/fetch';
import { notify } from '../utils/notify';
import { processAccounts } from './processAccounts';
import { processTransaction } from './processTransactions';

const PROCESS_NAME = 'processWebhookEvent';

export const processWebhookEvent = async (
  event: components['schemas']['WebhookEventCallback']
) => {
  const { data } = event;

  if (!data) {
    notify(ALERT_LEVEL.ERROR, 'No webhook data found');
  }
};

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  if (!Resource.UP_API_KEY.value || !Resource.UP_WEBHOOK_SECRET.value) {
    throw new Error(
      'Up API key or webhook secret not provided. Please set them in .env and run load-env'
    );
  }

  const { UP_WEBHOOK_SECRET } = Resource;

  /**
   * Authenticate incoming webhook event
   */
  const signature = event.headers[AUTHENTICITY_HEADER];
  const expectedSignature = signRequestBody(
    UP_WEBHOOK_SECRET.value,
    event.body
  );
  if (expectedSignature !== signature) {
    console.error('Invalid webhook signature');
    return {
      statusCode: 403,
    };
  }

  if (!event.body) {
    console.error('No webhook event payload found');
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Bad Request',
      }),
    };
  }

  // Yes, I should probably validate the schema here ...
  const { data } =
    event.body as unknown as components['schemas']['WebhookEventCallback'];

  if (!data) {
    notify(ALERT_LEVEL.ERROR, 'No webhook data found');
  }

  try {
    const { attributes, relationships } = data;
    const { eventType } = attributes;

    if (eventType === WebhookEventTypeEnum.PING) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Pong 👋' }),
      };
    }

    /**
     * Sync accounts before processing
     * transaction
     */
    await processAccounts();

    if (relationships?.transaction?.links?.related) {
      /**
       * Process transaction events
       * @see https://developer.up.com.au/#callback_post_webhookURL
       */
      if (
        eventType === WebhookEventTypeEnum.TRANSACTION_CREATED ||
        eventType === WebhookEventTypeEnum.TRANSACTION_SETTLED
      ) {
        await processTransaction(
          relationships?.transaction?.links?.related,
          'insert'
        );
      } else if (eventType === WebhookEventTypeEnum.TRANSACTION_DELETED) {
        await processTransaction(
          relationships?.transaction?.links?.related,
          'delete'
        );
      }
    }

    return {
      statusCode: 200,
    };
  } catch (error) {
    notify(ALERT_LEVEL.WARN, `Error in ${PROCESS_NAME}: ${error}`);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal Server Error',
      }),
    };
  }
};
