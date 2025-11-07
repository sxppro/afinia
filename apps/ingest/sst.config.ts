/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: 'afinia-ingest',
      removal: input?.stage === 'production' ? 'retain' : 'remove',
      protect: ['production'].includes(input?.stage),
      home: 'aws',
    };
  },
  async run() {
    const secrets = {
      upApiKey: new sst.Secret('UP_API_KEY'),
      upWebhookSecret: new sst.Secret('UP_WEBHOOK_SECRET'),
      databaseUrl: new sst.Secret('DATABASE_URL'),
      discordWebhookUrl: new sst.Secret('DISCORD_WEBHOOK_URL'),
      discordUserId: new sst.Secret('DISCORD_USER_ID'),
    };
    const allSecrets = Object.values(secrets);
    const api = new sst.aws.ApiGatewayV1('AfiniaIngestApi');
    api.route('POST /webhook', {
      handler: 'src/provider/up/modules/processWebhookEvent.handler',
      link: [...allSecrets],
      timeout: '5 minute',
      runtime: 'nodejs22.x',
    });
    api.deploy();
  },
});
