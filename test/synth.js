const test = require('tape').test ;
const config = require('config');
const opts = config.get('redis');
const fs = require('fs');

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

test('speech synth tests', async(t) => {
  const fn = require('..');
  const {synthAudio, client} = fn(opts);

  if (!process.env.GCP_FILE ||
    !process.env.ACCESS_KEY_ID ||
    !process.env.SECRET_ACCESS_KEY ||
    !process.env.REGION) {
      t.pass('skipping speech synth tests since no credentials provided');
      t.end();
      client.quit();
      return;
  }
  try {
    const creds = JSON.parse(fs.readFileSync(process.env.GCP_FILE));
    let opts = await synthAudio({
      vendor: 'google',
      credentials: {
        credentials: {
          client_email: creds.client_email,
          private_key: creds.private_key
        }
      },
      language: 'en-GB',
      gender: 'MALE', 
      text: 'This is a test.  This is only a test',
      salt: 'foo.bar'
    });
    t.ok(!opts.servedFromCache, `successfully synthesized non-cached google audio to ${opts.filepath}`);
  
    opts = await synthAudio({
      vendor: 'google',
      credentials: {
        credentials: {
          client_email: creds.client_email,
          private_key: creds.private_key
        }
      },
      language: 'en-GB',
      gender: 'MALE', 
      text: 'This is a test.  This is only a test'
    });
    t.ok(opts.servedFromCache, `successfully synthesized cached google audio to ${opts.filepath}`);

    opts = await synthAudio({
      vendor: 'aws',
      credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID,
        secretAccessKey: process.env.SECRET_ACCESS_KEY,
        region: process.env.REGION
      },
      language: 'en-US',
      voice: 'Amy', 
      text: 'This is a test.  This is only a test'
    });
    t.ok(!opts.servedFromCache, `successfully synthesized non-cached aws audio to ${opts.filepath}`);

    opts = await synthAudio({
      vendor: 'aws',
      credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID,
        secretAccessKey: process.env.SECRET_ACCESS_KEY,
        region: process.env.REGION
      },
      language: 'en-US',
      voice: 'Amy', 
      text: 'This is a test.  This is only a test'
    });
    t.ok(opts.servedFromCache, `successfully synthesized cached aws audio to ${opts.filepath}`);

    await client.flushallAsync();

    t.end();

  }
  catch (err) {
    console.error(err);
    t.end(err);
  }
  client.quit();
});

