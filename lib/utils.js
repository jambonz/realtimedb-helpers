const assert = require('assert');
const crypto = require('crypto');
const formurlencoded = require('form-urlencoded');
const {SynthesizerClient} = require('../stubs/nuance/synthesizer_grpc_pb');
const {RivaSpeechSynthesisClient} = require('../stubs/riva/proto/riva_tts_grpc_pb');
const grpc = require('@grpc/grpc-js');
const {Pool} = require('undici');
const pool = new Pool('https://auth.crt.nuance.com');
const HTTP_TIMEOUT = 5000;
const NUANCE_AUTH_ENDPOINT = 'tts.api.nuance.com:443';

/**
 * Future TODO: cache recently used connections to providers
 * to avoid connection overhead during a call.
 * Will need to periodically age them out to avoid memory leaks.
 */
//const nuanceClientMap = new Map();

const debug = require('debug')('jambonz:realtimedb-helpers');

function makeBasicAuthHeader(username, password) {
  if (!username || !password) return {};
  const creds = `${encodeURIComponent(username)}:${password || ''}`;
  const header = `Basic ${toBase64(creds)}`;
  return {Authorization: header};
}

function makeIbmKey(apiKey) {
  const hash = crypto.createHash('sha1');
  hash.update(apiKey);
  return `ibm:${hash.digest('hex')}`;
}

function makeNuanceKey(clientId, secret, scope) {
  const hash = crypto.createHash('sha1');
  hash.update(`${clientId}:${secret}:${scope}`);
  return `nuance:${hash.digest('hex')}`;
}

const getNuanceAccessToken = async(clientId, secret, scope = 'asr tts') => {
  const payload = {
    grant_type: 'client_credentials',
    scope
  };
  const auth = makeBasicAuthHeader(clientId, secret);
  const {statusCode, headers, body} =  await pool.request({
    path: '/oauth2/token',
    method: 'POST',
    headers: {
      ...auth,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: formurlencoded(payload),
    timeout: HTTP_TIMEOUT,
    followRedirects: false
  });

  if (200 !== statusCode) {
    debug({statusCode, headers, body: body.text()}, 'error fetching access token from Nuance');
    const err = new Error();
    err.statusCode = statusCode;
    throw err;
  }
  const json = await body.json();
  return json.access_token;
};

const createNuanceClient = async(access_token) => {

  //if (nuanceClientMap.has(access_token)) return nuanceClientMap.get(access_token);

  const generateMetadata = (params, callback) => {
    var metadata = new grpc.Metadata();
    metadata.add('authorization', `Bearer ${access_token}`);
    callback(null, metadata);
  };

  const sslCreds = grpc.credentials.createSsl();
  const authCreds = grpc.credentials.createFromMetadataGenerator(generateMetadata);
  const combined_creds = grpc.credentials.combineChannelCredentials(sslCreds, authCreds);
  const client = new SynthesizerClient(NUANCE_AUTH_ENDPOINT, combined_creds);

  //if (process.env.NUANCE_CACHE_TTS_CONNECTIONS) nuanceClientMap.set(access_token, client);
  return client;
};

const createRivaClient = async(rivaUri) => {
  const client = new RivaSpeechSynthesisClient(rivaUri, grpc.credentials.createInsecure());
  return client;
};


function makeCallKey(accountSid, callSid) {
  return `call:${accountSid}:${callSid}`;
}

function makeSynthKey({vendor, language, voice, engine = '', text}) {
  const hash = crypto.createHash('sha1');
  hash.update(`${language}:${vendor}:${voice}:${engine}:${text}`);
  return `tts:${hash.digest('hex')}`;
}

function makePatternForCallScan(accountSid) {
  return `call:${accountSid}:*`;
}
function makePatternForQueueScan(accountSid, pattern) {
  return `queue:${accountSid}:${pattern || '*'}`;
}

const toBase64 = (str) => Buffer.from(str || '', 'utf8').toString('base64');

const noopLogger = {
  info: () => {},
  debug: () => {},
  error: () => {}
};

function filterNullsAndObjects(obj) {
  debug(obj, 'filtering start');
  assert(typeof obj === 'object' && obj !== null);
  const filtered = Object.keys(obj)
    .filter((key) => obj[key] !== null && typeof obj[key] !== 'undefined' && typeof obj[key] !== 'object')
    .reduce((o, key) => {
      o[key] = obj[key];
      return o;
    }, {});
  debug(filtered, 'filtering done');
  return filtered;
}

module.exports = {
  makeCallKey,
  makeSynthKey,
  makeNuanceKey,
  makeIbmKey,
  getNuanceAccessToken,
  createNuanceClient,
  createRivaClient,
  makeBasicAuthHeader,
  makePatternForCallScan,
  makePatternForQueueScan,
  noopLogger,
  filterNullsAndObjects,
  NUANCE_AUTH_ENDPOINT,
  CALL_SET: 'active-call-sids'
};
