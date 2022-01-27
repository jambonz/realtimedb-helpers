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

test('speech synth tests', async(t) => {
  const fn = require('..');
  const {synthAudio, client} = fn(opts, logger);

  if (!process.env.GCP_FILE ||
    !process.env.MICROSOFT_API_KEY ||
    !process.env.MICROSOFT_REGION ||
    !process.env.AWS_ACCESS_KEY_ID ||
    !process.env.AWS_SECRET_ACCESS_KEY ||
    !process.env.AWS_REGION ||
    !process.env.WELLSAID_API_KEY) {
      t.pass('skipping speech synth tests since no credentials provided');
      t.end();
      client.quit();
      return;
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
    t.ok(!opts.servedFromCache, `successfully synthesized google audio to ${opts.filepath}`);
  
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

    opts = await synthAudio(stats, {
      vendor: 'aws',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION
      },
      language: 'en-US',
      voice: 'Amy', 
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
      voice: 'Amy', 
      text: 'This is a test.  This is only a test'
    });
    t.ok(opts.servedFromCache, `successfully retrieved aws audio from cache ${opts.filePath}`);

    const longText = `Henry is best known for his six marriages, including his efforts to have his first marriage 
    (to Catherine of Aragon) annulled. His disagreement with Pope Clement VII about such an 
    annulment led Henry to initiate the English Reformation, 
    separating the Church of England from papal authority. He appointed himself Supreme Head of the Church of England 
    and dissolved convents and monasteries, for which he was excommunicated. 
    Henry is also known as "the father of the Royal Navy," as he invested heavily in the navy, 
    increasing its size from a few to more than 50 ships, and established the Navy Board.`;

    opts = await synthAudio(stats, {
      vendor: 'microsoft',
      credentials: {
        api_key: process.env.MICROSOFT_API_KEY,
        region: process.env.MICROSOFT_REGION
      },
      language: 'en-US-ChristopherNeural',
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
      language: 'en-US-ChristopherNeural',
      voice: 'en-US-ChristopherNeural', 
      text: longText
    });
    t.ok(opts.servedFromCache, `successfully retrieved microsoft audio from cache ${opts.filePath}`);

    const ssml = `<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="en-US">
    <voice name="en-US-JennyNeural">
    <prosody volume="loud">Hi there,</prosody> and welcome to jambones! 
    jambones is the <sub alias="seapass">CPaaS</sub> designed with the needs of communication service providers in mind.
    This is an example of simple text-to-speech, but there is so much more you can do.
    Try us out!
    </voice>
    </speak>`;

    const shortText = "Hi there.  Would you like to order drinks first, or go straight to the main course?";
    opts = await synthAudio(stats, {
      vendor: 'wellsaid',
      credentials: {
        api_key: process.env.WELLSAID_API_KEY,
      },
      language: 'en-US',
      voice: '3',
      text: shortText
    });
    t.ok(!opts.servedFromCache, `successfully synthesized wellsaid audio to ${opts.filePath}`);

    opts = await synthAudio(stats, {
      vendor: 'wellsaid',
      credentials: {
        api_key: process.env.WELLSAID_API_KEY,
      },
      language: 'en-US',
      voice: '3',
      text: shortText
    });
    t.ok(opts.servedFromCache, `successfully retrieved cached wellsaid audio from ${opts.filePath}`);

    await client.flushallAsync();

    t.end();

  }
  catch (err) {
    console.error(err);
    t.end(err);
  }
  client.quit();
});

