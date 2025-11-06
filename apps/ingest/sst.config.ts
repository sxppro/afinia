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
    const api = new sst.aws.Function('loadData', {
      handler: 'src/provider/up/modules/loadData.handler',
      timeout: '1 minute',
      runtime: 'nodejs22.x',
      url: true,
    });
    console.log(`loadData: ${api.url}`);
  },
});
