const assert = require('assert');
const {noopLogger, createNuanceClient} = require('./utils');
const getNuanceAccessToken = require('./get-nuance-access-token');
const {GetVoicesRequest, Voice} = require('../stubs/nuance/synthesizer_pb');

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
async function getTtsVoices(client, logger, {vendor, credentials}) {
  const {client_id: clientId, secret: secret} = credentials;
  logger = logger || noopLogger;

  assert.ok(['nuance'].includes(vendor),
    `getTtsVoices not supported for vendor ${vendor}`);

  /* get a nuance access token */
  const {access_token} = await getNuanceAccessToken(client, logger, clientId, secret, 'tts');
  const nuanceClient = await createNuanceClient(access_token);

  /* retrieve all voices */
  const v = new Voice();
  const request = new GetVoicesRequest();
  request.setVoice(v);

  return new Promise((resolve, reject) => {
    nuanceClient.getVoices(request, (err, response) => {
      if (err) return reject(err);
      const voices = response.getVoicesList()
        .map((v) => {
          return {
            language: v.getLanguage(),
            name: v.getName(),
            model: v.getModel(),
            gender: v.getGender() === 1 ? 'male' : 'female'
          };
        });
      resolve(voices);
    });
  });
}


module.exports = getTtsVoices;
