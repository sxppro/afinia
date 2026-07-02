import { components, WebhookEventTypeEnum } from 'afinia-common/providers/up';
import { SQSHandler } from 'aws-lambda';
import { Resource } from 'sst';
import { ALERT_LEVEL } from '../utils/constants';
import { notify } from '../utils/notify';
import { processAccounts } from './processAccounts';
import { processTags } from './processTags';
import { processTransaction } from './processTransactions';
import { sendPushNotifications } from './sendPushNotifications';

export const handler: SQSHandler = async (event) => {
  if (!Resource.UP_API_KEY.value) {
    throw new Error(
      'Up API key not provided. Please set it in .env and run load-env'
    );
  }

  for (const record of event.Records) {
    const { data } = JSON.parse(
      record.body
    ) as components['schemas']['WebhookEventCallback'];

    if (!data) {
      await notify(ALERT_LEVEL.ERROR, 'No webhook data in queued message');
      return;
    }

    const { attributes, relationships } = data;
    const { eventType } = attributes;

    if (!relationships?.transaction?.data?.id) {
      await notify(
        ALERT_LEVEL.ERROR,
        'Queued webhook event missing transaction ID'
      );
      return;
    }

    /**
     * Sync accounts and tags before processing transaction
     */
    await processAccounts();
    await processTags();

    /**
     * Process transaction events
     * @see https://developer.up.com.au/#callback_post_webhookURL
     */
    if (
      eventType === WebhookEventTypeEnum.TRANSACTION_CREATED ||
      eventType === WebhookEventTypeEnum.TRANSACTION_SETTLED
    ) {
      await processTransaction('insert', relationships.transaction.data.id);

      /**
       * Push notifications only on created
       */
      if (eventType === WebhookEventTypeEnum.TRANSACTION_CREATED) {
        await sendPushNotifications(relationships.transaction.data.id);
      }
    } else if (eventType === WebhookEventTypeEnum.TRANSACTION_DELETED) {
      await processTransaction('delete', relationships.transaction.data.id);
    }
  }
};
