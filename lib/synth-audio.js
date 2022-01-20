const assert = require('assert');
const fs = require('fs');
const ttsGoogle = require('@google-cloud/text-to-speech');
const Polly = require('aws-sdk/clients/polly');
const sdk = require('microsoft-cognitiveservices-speech-sdk');
const {
  AudioConfig,
  ResultReason,
  SpeechConfig,
  SpeechSynthesizer,
  CancellationDetails,
  SpeechSynthesisOutputFormat
} = sdk;
const {makeSynthKey, noopLogger} = require('./utils');
const debug = require('debug')('jambonz:realtimedb-helpers');
const EXPIRES = 3600 * 24; // cache tts for 24 hours
const TMP_FOLDER = '/tmp';

/**
 * Synthesize speech to an mp3 file, and also cache the generated speech
 * in redis (base64 format) for 24 hours so as to avoid unnecessarily paying
 * time and again for speech synthesis of the same text.
 * It is the responsibility of the caller to unlink the mp3 file after use.
 *
 * @param {*} client - redis client
 * @param {*} logger - pino logger
 * @param {object} opts - options
 * @param {string} opts.vendor - 'google' or 'aws' ('polly' is an alias for 'aws')
 * @param {string} opt.language - language code
 * @param {string} opts.voice - voice identifier
 * @param {string} opts.text - text or ssml to synthesize
 * @returns object containing filepath to an mp3 file in the /tmp folder containing
 * the synthesized audio, and a variable indicating whether it was served from cache
 */
async function synthAudio(client, logger, stats, {vendor, language, voice, gender, text, platform, salt, credentials}) {
  let audioBuffer;
  let servedFromCache = false;
  logger = logger || noopLogger;

  assert.ok(['google', 'aws', 'polly', 'microsoft'].includes(vendor),
    `synthAudio supported vendors are google and aws (alias polly), not ${vendor}`);
  if ('google' === vendor) {
    assert.ok(language, 'synthAudio requires language when google is used');
  }
  if (['aws', 'polly'].includes(vendor))  {
    assert.ok(voice, 'synthAudio requires voice when aws polly is used');
  }
  if ('microsoft' === vendor) {
    assert.ok(language, 'synthAudio requires language when microsoft is used');
    assert.ok(voice, 'synthAudio requires voice when aws microsoft is used');
  }

  const key = makeSynthKey(vendor, language, voice, text);
  const filePath = `${TMP_FOLDER}/${key.replace('tts:', `tts-${salt || ''}`)}.mp3`;
  debug(`synth key is ${key}`);
  const result = await client.getAsync(key);
  if (result) {
    // found in cache - extend the expiry and use it
    debug('result WAS found in cache');
    servedFromCache = true;
    stats.increment('tts.cache.requests', ['found:yes']);
    audioBuffer = Buffer.from(result, 'base64');
    client.expireAsync(key, EXPIRES).catch((err) => logger.info(err, 'Error setting expires'));
  }
  if (!result) {
    // not found in cache - go get it from speech vendor and add to cache
    debug('result was NOT found in cache');
    stats.increment('tts.cache.requests', ['found:no']);
    const startAt = process.hrtime();
    switch (vendor) {
      case 'google':
        audioBuffer = await synthGoogle(logger, {credentials, stats, language, voice, gender, text});
        break;
      case 'aws':
      case 'polly':
        audioBuffer = await synthPolly(logger, {credentials, stats, language, voice, text, platform});
        break;
      case 'microsoft':
        audioBuffer = await synthMicrosoft(logger, {credentials, stats, language, voice, text, filePath});
        break;
      default:
        assert(`synthAudio: unsupported speech vendor ${vendor}`);
    }
    const diff = process.hrtime(startAt);
    const time = diff[0] * 1e3 + diff[1] * 1e-6;
    const rtt = time.toFixed(0);
    stats.histogram('tts.response_time', rtt,
      [`vendor:${'google' === vendor ? vendor : 'aws'}`]);
    debug(`tts rtt time for ${text.length} chars on ${vendor}: ${rtt}`);
    logger.info(`tts rtt time for ${text.length} chars on ${vendor}: ${rtt}`);

    client.setexAsync(key, EXPIRES, audioBuffer.toString('base64'))
      .catch((err) => logger.error(err, `error calling setex on key ${key}`));

    if (vendor === 'microsoft') return {filePath, servedFromCache};
  }

  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, audioBuffer, (err) => {
      if (err) return reject(err);
      resolve({filePath, servedFromCache});
    });
  });
}

const synthPolly = (logger, {credentials, stats, language, voice, platform, text}) => {
  // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Polly.html#constructor-property
  const polly = new Polly(credentials);
  const opts = {
    Platform: platform,
    OutputFormat: 'mp3',
    Text: text,
    LanguageCode: language,
    TextType: text.startsWith('<speak>') ? 'ssml' : 'text',
    VoiceId: voice
  };
  return new Promise((resolve, reject) => {
    polly.synthesizeSpeech(opts, (err, data) => {
      if (err) {
        console.error(err);
        logger.info({err}, 'synthAudio: Error synthesizing speech using aws polly');
        stats.increment('tts.count', ['vendor:aws', 'accepted:no']);
        return reject(err);
      }
      stats.increment('tts.count', ['vendor:aws', 'accepted:yes']);
      resolve(data.AudioStream);
    });
  });
};

const synthGoogle = async(logger, {credentials, stats, language, voice, gender, text}) => {
  const client = new ttsGoogle.TextToSpeechClient(credentials);
  const opts = {
    voice: {
      name: voice,
      languageCode: language,
      ssmlGender: gender || 'SSML_VOICE_GENDER_UNSPECIFIED'
    },
    audioConfig: {audioEncoding: 'MP3'}
  };
  Object.assign(opts, {input: text.startsWith('<speak>') ? {ssml: text} : {text}});
  try {
    const responses = await client.synthesizeSpeech(opts);
    stats.increment('tts.count', ['vendor:google', 'accepted:yes']);
    return responses[0].audioContent;
  } catch (err) {
    console.error(err);
    logger.info({err}, 'synthAudio: Error synthesizing speech using google');
    stats.increment('tts.count', ['vendor:google', 'accepted:no']);
    throw err;
  }
};

const synthMicrosoft = async(logger, {credentials, stats, language, voice, text, filePath}) => {
  try {
    const {api_key: apiKey, region} = credentials;
    const speechConfig = SpeechConfig.fromSubscription(apiKey, region);
    speechConfig.speechSynthesisLanguage = language;
    speechConfig.speechSynthesisVoiceName = voice;
    speechConfig.speechSynthesisOutputFormat = SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;
    const config = AudioConfig.fromAudioFileOutput(filePath);
    const synthesizer = new SpeechSynthesizer(speechConfig, config);

    let content = text;
    if (text.startsWith('<speak>')) {
      /* microsoft enforces some properties and uses voice xml element so if the user did not supply do it for them */
      const words = text.slice(7, -8).trim().replace(/(\r\n|\n|\r)/gm, ' ');
      // eslint-disable-next-line max-len
      content = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${language}"><voice name="${voice}">${words}</voice></speak>`;
      logger.info({content}, synthMicrosoft);
    }

    return new Promise((resolve, reject) => {
      const speakAsync = content.startsWith('<speak') ?
        synthesizer.speakSsmlAsync.bind(synthesizer) :
        synthesizer.speakTextAsync.bind(synthesizer);
      speakAsync(
        content,
        async(result) => {
          switch (result.reason) {
            case ResultReason.Canceled:
              const cancellation = CancellationDetails.fromResult(result);
              logger.info({reason: cancellation.errorDetails}, 'synthAudio: (Microsoft) synthesis canceled');
              reject(cancellation.errorDetails);
              break;
            case ResultReason.SynthesizingAudioCompleted:
              stats.increment('tts.count', ['vendor:microsoft', 'accepted:yes']);
              fs.readFile(filePath, (err, data) => {
                if (err) return reject(err);
                resolve(data);
              });
              break;
            default:
              break;
          }
        },
        (err) => {
          logger.info({err}, 'synthAudio: (Microsoft) error synthesizing');
          stats.increment('tts.count', ['vendor:microsoft', 'accepted:no']);
          reject(err);
        });
    });
  } catch (err) {
    logger.info({err}, 'synthAudio: Error synthesizing speech using google');
    stats.increment('tts.count', ['vendor:google', 'accepted:no']);
  }
};

module.exports = synthAudio;
