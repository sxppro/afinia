import { components } from 'afinia-common/types/up-api';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { ALERT_LEVEL, AUTHENTICITY_HEADER } from '../utils/constants';
import { signRequestBody } from '../utils/fetch';
import { notify } from '../utils/notify';

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
  if (!process.env.UP_API_KEY || !process.env.UP_WEBHOOK_SECRET) {
    throw new Error('Up API key or webhook secret not provided');
  }

  /**
   * Authenticate incoming webhook event
   */
  const signature = event.headers[AUTHENTICITY_HEADER];
  const expectedSignature = signRequestBody(
    process.env.UP_WEBHOOK_SECRET,
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
  await processWebhookEvent(
    event.body as unknown as components['schemas']['WebhookEventCallback']
  );

  return {
    statusCode: 200,
  };
};
