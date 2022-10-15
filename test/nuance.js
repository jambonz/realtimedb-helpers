const test = require('tape').test ;
const config = require('config');
const opts = config.get('redis');
const fs = require('fs');
const logger = require('pino')({level: 'error'});

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

const stats = {
  increment: () => {},
  histogram: () => {}
};

test('Nuance access token tests', async(t) => {
  const fn = require('..');
  const {getNuanceAccessToken, client} = fn(opts, logger);

  if (!process.env.NUANCE_CLIENT_ID || !process.env.NUANCE_SECRET ) {
      t.pass('skipping Nuance access token test since no Nuance client_id and secret provided');
      t.end();
      client.quit();
      return;
  }
  try {
    let json = await getNuanceAccessToken(process.env.NUANCE_CLIENT_ID, process.env.NUANCE_SECRET, 'asr tts');
    t.ok(!json.servedFromCache, 'successfully retrieved access token from Nuance');

    json = await getNuanceAccessToken(process.env.NUANCE_CLIENT_ID, process.env.NUANCE_SECRET, 'asr tts');
    t.ok(json.servedFromCache, 'successfully retrieved access token from cache');

    await client.flushallAsync();

    t.end();

  }
  catch (err) {
    console.error(err);
    t.end(err);
  }
  client.quit();
});

