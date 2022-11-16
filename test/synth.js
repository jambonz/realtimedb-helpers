const test = require('tape').test ;
const config = require('config');
const opts = config.get('redis');
const fs = require('fs');
const logger = require('pino')();

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

const stats = {
  increment: () => {},
  histogram: () => {}
};

test('Google speech synth tests', async(t) => {
  const fn = require('..');
  const {synthAudio, client} = fn(opts, logger);

  if (!process.env.GCP_FILE ) {
      t.pass('skipping google speech synth tests since GCP_FILE not provided');
      return t.end();
  }
  try {
    const creds = JSON.parse(fs.readFileSync(process.env.GCP_FILE));
    let opts = await synthAudio(stats, {
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
    t.ok(!opts.servedFromCache, `successfully synthesized google audio to ${opts.filePath}`);
  
    opts = await synthAudio(stats,{
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
    t.ok(opts.servedFromCache, `successfully retrieved cached google audio from ${opts.filePath}`);
  }
  catch (err) {
    console.error(err);
    t.end(err);
  }
  client.quit();
});

test('AWS speech synth tests', async(t) => {
  const fn = require('..');
  const {synthAudio, client} = fn(opts, logger);

  if (process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_REGION) { 
    t.pass('skipping AWS speech synth tests since AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, or AWS_REGION not provided');
    return t.end();
  }
  try {
    let opts = await synthAudio(stats, {
      vendor: 'aws',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION
      },
      language: 'en-US',
      voice: 'Joey', 
      text: 'This is a test.  This is only a test'
    });
    t.ok(!opts.servedFromCache, `successfully synthesized aws audio to ${opts.filePath}`);

    opts = await synthAudio(stats, {
      vendor: 'aws',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION
      },
      language: 'en-US',
      voice: 'Joey', 
      text: 'This is a test.  This is only a test'
    });
    t.ok(opts.servedFromCache, `successfully retrieved aws audio from cache ${opts.filePath}`);
  }
  catch (err) {
    console.error(err);
    t.end(err);
  }
  client.quit();
});

test('Azure speech synth tests', async(t) => {
  const fn = require('..');
  const {synthAudio, client} = fn(opts, logger);

  if (!process.env.MICROSOFT_API_KEY || !process.env.MICROSOFT_REGION) {
    t.pass('skipping Microsoft speech synth tests since MICROSOFT_API_KEY or MICROSOFT_REGION not provided');
    return t.end();
  }
  try {
    const longText = `Henry is best known for his six marriages, including his efforts to have his first marriage 
    (to Catherine of Aragon) annulled. His disagreement with Pope Clement VII about such an 
    annulment led Henry to initiate the English Reformation, 
    separating the Church of England from papal authority. He appointed himself Supreme Head of the Church of England 
    and dissolved convents and monasteries, for which he was excommunicated. 
    Henry is also known as "the father of the Royal Navy," as he invested heavily in the navy, 
    increasing its size from a few to more than 50 ships, and established the Navy Board.`;

    let opts = await synthAudio(stats, {
      vendor: 'microsoft',
      credentials: {
        api_key: process.env.MICROSOFT_API_KEY,
        region: process.env.MICROSOFT_REGION
      },
      language: 'en-US',
      voice: 'en-US-ChristopherNeural', 
      text: longText
    });
    t.ok(!opts.servedFromCache, `successfully synthesized microsoft audio to ${opts.filePath}`);


    opts = await synthAudio(stats, {
      vendor: 'microsoft',
      credentials: {
        api_key: process.env.MICROSOFT_API_KEY,
        region: process.env.MICROSOFT_REGION
      },
      language: 'en-US',
      voice: 'en-US-ChristopherNeural', 
      text: longText
    });
    t.ok(opts.servedFromCache, `successfully retrieved microsoft audio from cache ${opts.filePath}`);
  }
  catch (err) {
    console.error(err); 
    t.end(err);
  }
  client.quit();
});

test('Azure custom voice speech synth tests', async(t) => {
  const fn = require('..');
  const {synthAudio, client} = fn(opts, logger);

  if (!process.env.MICROSOFT_CUSTOM_API_KEY || !process.env.MICROSOFT_DEPLOYMENT_ID || !process.env.MICROSOFT_CUSTOM_REGION) {
    t.pass('skipping Microsoft speech synth custom voice tests since MICROSOFT_CUSTOM_API_KEY or MICROSOFT_DEPLOYMENT_ID or MICROSOFT_CUSTOM_REGION not provided');
    return t.end();
  }
  try {
    const text = 'Hi, this is my custom voice. How does it sound to you?  Do I have a future as a virtual bot?';
    let opts = await synthAudio(stats, {
      vendor: 'microsoft',
      credentials: {
        api_key: process.env.MICROSOFT_CUSTOM_API_KEY,
        region: process.env.MICROSOFT_CUSTOM_REGION,
        use_custom_tts: true,
        custom_tts_endpoint: process.env.MICROSOFT_DEPLOYMENT_ID
      },
      language: 'en-US',
      voice: process.env.MICROSOFT_CUSTOM_VOICE,
      text
    });
    t.ok(!opts.servedFromCache, `successfully synthesized microsoft audio to ${opts.filePath}`);

    opts = await synthAudio(stats, {
      vendor: 'microsoft',
      credentials: {
        api_key: process.env.MICROSOFT_CUSTOM_API_KEY,
        region: process.env.MICROSOFT_CUSTOM_REGION,
        use_custom_tts: true,
        custom_tts_endpoint: process.env.MICROSOFT_DEPLOYMENT_ID
      },
      language: 'en-US',
      voice: process.env.MICROSOFT_CUSTOM_VOICE,
      text
    });
    t.ok(opts.servedFromCache, `successfully retrieved microsoft custom voice audio from cache ${opts.filePath}`);
  }
  catch (err) {
    console.error(err); 
    t.end(err);
  }
  client.quit();
});

test('Nuance speech synth tests', async(t) => {
  const fn = require('..');
  const {synthAudio, client} = fn(opts, logger);

  if (!process.env.NUANCE_CLIENT_ID || !process.env.NUANCE_SECRET) { 
    t.pass('skipping Nuance speech synth tests since NUANCE_CLIENT_ID or NUANCE_SECRET not provided');
    return t.end();
  }
  try {
    let opts = await synthAudio(stats, {
      vendor: 'nuance',
      credentials: {
        client_id: process.env.NUANCE_CLIENT_ID,
        secret: process.env.NUANCE_SECRET
      },
      language: 'en-US',
      voice: 'Evan', 
      text: 'This is a test.  This is only a test'
    });
    t.ok(!opts.servedFromCache, `successfully synthesized nuance audio to ${opts.filePath}`);

    opts = await synthAudio(stats, {
      vendor: 'nuance',
      credentials: {
        client_id: process.env.NUANCE_CLIENT_ID,
        secret: process.env.NUANCE_SECRET
      },
      language: 'en-US',
      voice: 'Evan', 
      text: 'This is a test.  This is only a test'
    });
    t.ok(opts.servedFromCache, `successfully retrieved nuance audio from cache ${opts.filePath}`);
  }
  catch (err) {
    console.error(err);
    t.end(err);
  }
  client.quit();
});

test('IBM watson speech synth tests', async(t) => {
  const fn = require('..');
  const {synthAudio, client} = fn(opts, logger);

  if (!process.env.IBM_TTS_API_KEY || !process.env.IBM_TTS_REGION) { 
    t.pass('skipping IBM Watson speech synth tests since IBM_TTS_API_KEY or IBM_TTS_API_KEY not provided');
    return t.end();
  }
  try {
    let opts = await synthAudio(stats, {
      vendor: 'ibm',
      credentials: {
        tts_api_key: process.env.IBM_TTS_API_KEY,
        tts_region: process.env.IBM_TTS_REGION
      },
      language: 'en-US',
      voice: 'en-US_AllisonV2Voice', 
      text: 'This is a test.  This is only a test'
    });
    t.ok(!opts.servedFromCache, `successfully synthesized ibm audio to ${opts.filePath}`);

    opts = await synthAudio(stats, {
      vendor: 'ibm',
      credentials: {
        tts_api_key: process.env.IBM_TTS_API_KEY,
        tts_region: process.env.IBM_TTS_REGION
      },
      language: 'en-US',
      voice: 'en-US_AllisonV2Voice', 
      text: 'This is a test.  This is only a test'
    });
    t.ok(opts.servedFromCache, `successfully retrieved ibm audio from cache ${opts.filePath}`);
  }
  catch (err) {
    console.error(err);
    t.end(err);
  }
  client.quit();
});