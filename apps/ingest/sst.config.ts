/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: 'afinia-ingest',
      removal: input?.stage === 'prod' ? 'retain' : 'remove',
      protect: ['prod'].includes(input?.stage),
      home: 'aws',
    };
  },
  async run() {
    const secrets = {
      baseUrl: new sst.Secret('BASE_URL'),
      upApiKey: new sst.Secret('UP_API_KEY'),
      upWebhookSecret: new sst.Secret('UP_WEBHOOK_SECRET'),
      databaseUrl: new sst.Secret('DATABASE_URL'),
      discordWebhookUrl: new sst.Secret('DISCORD_WEBHOOK_URL'),
      discordUserId: new sst.Secret('DISCORD_USER_ID'),
      vapidPrivateKey: new sst.Secret('VAPID_PRIVATE_KEY'),
      vapidPublicKey: new sst.Secret('VAPID_PUBLIC_KEY'),
    };
    const allSecrets = Object.values(secrets);

    const dlq = new sst.aws.Queue('AfiniaWebhookDlq', { fifo: true });
    dlq.subscribe({
      handler: 'src/provider/up/modules/notifyWebhookFailure.handler',
      link: [secrets.discordWebhookUrl, secrets.discordUserId],
      runtime: 'nodejs22.x',
    });

    const queue = new sst.aws.Queue('AfiniaWebhookQueue', {
      fifo: true,
      dlq: { queue: dlq.arn, retry: 3 },
      visibilityTimeout: '6 minutes',
    });
    queue.subscribe(
      {
        handler: 'src/provider/up/modules/processQueuedWebhookEvent.handler',
        link: [...allSecrets],
        runtime: 'nodejs22.x',
        timeout: '60 seconds',
        logging: { retention: '3 months' },
      },
      { batch: { size: 1 } }
    );

    const api = new sst.aws.ApiGatewayV1('AfiniaIngestApi');
    api.route('POST /webhook', {
      handler: 'src/provider/up/modules/processWebhookEvent.handler',
      link: [
        queue,
        secrets.upApiKey,
        secrets.upWebhookSecret,
        secrets.discordWebhookUrl,
        secrets.discordUserId,
        secrets.vapidPrivateKey,
        secrets.vapidPublicKey,
        secrets.baseUrl,
      ],
      logging: {
        retention: '3 months',
      },
      runtime: 'nodejs22.x',
      timeout: '30 seconds',
    });
    api.deploy();

    new sst.aws.Cron('AfiniaSyncHourly', {
      function: {
        handler: 'src/provider/up/modules/syncData.handler',
        timeout: '600 seconds',
        runtime: 'nodejs22.x',
        link: [
          secrets.upApiKey,
          secrets.databaseUrl,
          secrets.discordWebhookUrl,
          secrets.discordUserId,
        ],
        logging: {
          retention: '1 month',
        },
      },
      schedule: 'rate(1 hour)',
    });

    new sst.aws.Cron('AfiniaSyncSixHourly', {
      function: {
        handler: 'src/provider/up/modules/syncTransactions.handler',
        timeout: '600 seconds',
        runtime: 'nodejs22.x',
        link: [
          secrets.upApiKey,
          secrets.databaseUrl,
          secrets.discordWebhookUrl,
          secrets.discordUserId,
        ],
        logging: {
          retention: '1 month',
        },
      },
      schedule: 'rate(6 hours)',
    });
  },
});
