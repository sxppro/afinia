import { components } from 'afinia-common/providers/up';
import { SQSHandler } from 'aws-lambda';
import { Resource } from 'sst';
import { ALERT_LEVEL } from '../utils/constants';
import { notify } from '../utils/notify';

export const handler: SQSHandler = async (event) => {
  if (!Resource.DISCORD_WEBHOOK_URL.value || !Resource.DISCORD_USER_ID.value) {
    throw new Error(
      'Discord webhook URL or user ID not provided. Please set them in .env and run load-env'
    );
  }

  for (const record of event.Records) {
    const body = record.body;
    let webhookEventId = '';
    let eventType = 'unknown';
    let transactionId = 'unknown';

    try {
      const parsed = JSON.parse(
        body
      ) as components['schemas']['WebhookEventCallback'];
      webhookEventId = parsed.data.id;
      eventType = parsed.data?.attributes?.eventType ?? 'unknown';
      transactionId =
        parsed.data?.relationships?.transaction?.data?.id ?? 'unknown';
    } catch {
      console.error('Failed to parse webhook event payload: ', body);
    }

    const message = `Webhook event exhausted retries\nWebhook event ID: ${webhookEventId}\nEvent type: ${eventType}\nTransaction ID: ${transactionId}`;

    // Send alert but don't throw in DLQ
    try {
      await notify(ALERT_LEVEL.ERROR, message);
    } catch {
      console.info('DLQ succeeded');
    }
  }
};
