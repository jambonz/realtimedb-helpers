const test = require('tape').test ;
const config = require('config');
const opts = config.get('redis');

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

test('speech synth tests', async(t) => {
  const fn = require('..');
  const {synthAudio, client} = fn(opts);

  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    !process.env.AWS_ACCESS_KEY_ID ||
    !process.env.AWS_SECRET_ACCESS_KEY ||
    !process.env.AWS_REGION) {
      t.pass('skipping speech synth tests since no credentials provided');
      t.end();
      client.quit();
      return;
  }
  try {
    let filepath = await synthAudio({
      vendor: 'google',
      language: 'en-GB',
      gender: 'MALE', 
      text: 'This is a test.  This is only a test',
      salt: 'foo.bar'
    });
    t.pass(`successfully synthesized non-cached google audio to ${filepath}`);
  
    filepath = await synthAudio({
      vendor: 'google',
      language: 'en-GB',
      gender: 'MALE', 
      text: 'This is a test.  This is only a test'
    });
    t.pass(`successfully synthesized cached google audio to ${filepath}`);

    filepath = await synthAudio({
      vendor: 'aws',
      language: 'en-US',
      voice: 'Amy', 
      text: 'This is a test.  This is only a test'
    });
    t.pass(`successfully synthesized non-cached aws audio to ${filepath}`);

    filepath = await synthAudio({
      vendor: 'aws',
      language: 'en-US',
      voice: 'Amy', 
      text: 'This is a test.  This is only a test'
    });
    t.pass(`successfully synthesized cached aws audio to ${filepath}`);

    await client.flushallAsync();

    t.end();

  }
  catch (err) {
    console.error(err);
    t.end(err);
  }
  client.quit();
});

