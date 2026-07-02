import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { components, WebhookEventTypeEnum } from 'afinia-common/providers/up';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { Resource } from 'sst';
import { ALERT_LEVEL, AUTHENTICITY_HEADER } from '../utils/constants';
import { signData } from '../utils/fetch';
import { notify } from '../utils/notify';
import { sendTestPushNotification } from './sendPushNotifications';

const PROCESS_NAME = 'processWebhookEvent';
const sqs = new SQSClient();

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

    const { attributes, relationships, id } = data;
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

    await sqs.send(
      new SendMessageCommand({
        QueueUrl: Resource.AfiniaWebhookQueue.url,
        MessageBody: event.body,
        MessageGroupId: relationships.transaction.data.id,
        MessageDeduplicationId: id,
      })
    );

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
