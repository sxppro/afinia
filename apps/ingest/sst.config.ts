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

    const api = new sst.aws.ApiGatewayV1('AfiniaIngestApi');
    api.route('POST /webhook', {
      handler: 'src/provider/up/modules/processWebhookEvent.handler',
      link: [...allSecrets],
      logging: {
        retention: '3 months',
      },
      runtime: 'nodejs22.x',
      timeout: '30 seconds',
    });
    api.deploy();

    const cronSecrets = [
      secrets.upApiKey,
      secrets.databaseUrl,
      secrets.discordWebhookUrl,
      secrets.discordUserId,
    ];

    new sst.aws.Cron('AfiniaSyncRecent', {
      function: {
        handler: 'src/provider/up/modules/syncRecent.handler',
        timeout: '600 seconds',
        runtime: 'nodejs22.x',
        link: cronSecrets,
        logging: {
          retention: '1 month',
        },
      },
      schedule: 'rate(15 minutes)',
    });

    new sst.aws.Cron('AfiniaSyncDaily', {
      function: {
        handler: 'src/provider/up/modules/syncData.handler',
        timeout: '600 seconds',
        runtime: 'nodejs22.x',
        link: cronSecrets,
        logging: {
          retention: '3 months',
        },
      },
      schedule: 'cron(30 14 * * ? *)',
    });

    new sst.aws.Cron('AfiniaSyncSixHourly', {
      function: {
        handler: 'src/provider/up/modules/syncTransactions.handler',
        timeout: '600 seconds',
        runtime: 'nodejs22.x',
        link: cronSecrets,
        logging: {
          retention: '3 months',
        },
      },
      schedule: 'cron(10 3/6 * * ? *)',
    });
  },
});
