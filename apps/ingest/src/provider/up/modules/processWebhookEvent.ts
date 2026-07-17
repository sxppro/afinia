import { components, WebhookEventTypeEnum } from 'afinia-common/providers/up';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { Resource } from 'sst';
import { ALERT_LEVEL, AUTHENTICITY_HEADER } from '../utils/constants';
import { signData } from '../utils/fetch';
import { notify } from '../utils/notify';
import { processTransaction } from './processTransactions';
import {
  sendPushNotifications,
  sendTestPushNotification,
} from './sendPushNotifications';

const PROCESS_NAME = 'processWebhookEvent';

export const processWebhookEvent = async (
  event: components['schemas']['WebhookEventCallback']
) => {
  const { data } = event;

  if (!data) {
    await notify(ALERT_LEVEL.ERROR, 'No webhook data found');
  }
};

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  if (!Resource.UP_API_KEY.value || !Resource.UP_WEBHOOK_SECRET.value) {
    throw new Error(
      'Up API key or webhook secret not provided. Please set them in .env and run load-env'
    );
  }

  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Bad Request',
      }),
    };
  }

  /**
   * Authenticate incoming webhook event
   */
  const { UP_WEBHOOK_SECRET } = Resource;
  const signature = event.headers[AUTHENTICITY_HEADER];
  const expectedSignature = signData(UP_WEBHOOK_SECRET.value, event.body);
  if (expectedSignature !== signature) {
    console.error('Invalid webhook signature');
    return {
      statusCode: 403,
    };
  }

  try {
    // Yes, I should probably validate the schema here ...
    const { data } = JSON.parse(
      event.body
    ) as unknown as components['schemas']['WebhookEventCallback'];

    if (!data) {
      await notify(ALERT_LEVEL.ERROR, 'No webhook data found');
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Bad Request',
        }),
      };
    }

    const { attributes, relationships } = data;
    const { eventType } = attributes;

    if (eventType === WebhookEventTypeEnum.PING) {
      await sendTestPushNotification();
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Pong 👋' }),
      };
    }

    // Check that we have a transaction ID
    if (!relationships?.transaction?.data?.id) {
      await notify(ALERT_LEVEL.WARN, 'Webhook event missing transaction ID');
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Bad Request' }),
      };
    }

    /**
     * Process transaction events
     * @see https://developer.up.com.au/#callback_post_webhookURL
     */
    if (
      eventType === WebhookEventTypeEnum.TRANSACTION_CREATED ||
      eventType === WebhookEventTypeEnum.TRANSACTION_SETTLED
    ) {
      const metrics = await processTransaction(
        'insert',
        relationships.transaction.data.id
      );

      /**
       * If transaction was not processed due to missing account
       * or failed fetch, notify and return 500
       */
      if (metrics.transactions.processed === 0) {
        console.error(
          `[${PROCESS_NAME}] Failed to process transaction: ${relationships.transaction.data.id}, possibly due to missing account or failed to retrieve transaction details from provider`,
          {
            missingAccounts: Array.from(metrics.errors.missingAccounts),
            missingCategories: Array.from(metrics.errors.missingCategories),
            missingTags: Array.from(metrics.errors.missingTags),
          }
        );
        await notify(
          ALERT_LEVEL.ERROR,
          `[${PROCESS_NAME}] Failed to process transaction: ${relationships.transaction.data.id}`
        );
        return {
          statusCode: 500,
          body: JSON.stringify({ message: 'Failed to process transaction' }),
        };
      }

      /**
       * Warn if missing categories or tags
       */
      if (
        metrics.errors.missingCategories.size > 0 ||
        metrics.errors.missingTags.size > 0
      ) {
        console.warn(
          `[${PROCESS_NAME}] Transaction processed with incomplete data: ${relationships.transaction.data.id}`,
          {
            missingCategories: Array.from(metrics.errors.missingCategories),
            missingTags: Array.from(metrics.errors.missingTags),
          }
        );
        await notify(
          ALERT_LEVEL.WARN,
          `[${PROCESS_NAME}] Transaction processed with incomplete data: ${relationships.transaction.data.id}`
        );
      }

      /**
       * Push notifications only on created
       */
      if (eventType === WebhookEventTypeEnum.TRANSACTION_CREATED) {
        await sendPushNotifications(relationships.transaction.data.id);
      }
    } else if (eventType === WebhookEventTypeEnum.TRANSACTION_DELETED) {
      await processTransaction('delete', relationships.transaction.data.id);
    }

    return {
      statusCode: 200,
    };
  } catch (error) {
    await notify(
      ALERT_LEVEL.WARN,
      `Error in ${PROCESS_NAME}: ${error instanceof Error ? error.message : JSON.stringify(error)}`
    );
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal server error',
      }),
    };
  }
};
