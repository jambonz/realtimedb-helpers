const assert = require('assert');
const crypto = require('crypto');
const debug = require('debug')('jambonz:realtimedb-helpers');

function makeNuanceKey(clientId, secret, scope) {
  const hash = crypto.createHash('sha1');
  hash.update(`${clientId}:${secret}:${scope}`);
  return `nuance:${hash.digest('hex')}`;
}

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

function makeBasicAuthHeader(username, password) {
  if (!username || !password) return {};
  const creds = `${encodeURIComponent(username)}:${password || ''}`;
  const header = `Basic ${toBase64(creds)}`;
  return {Authorization: header};
}

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
  makeBasicAuthHeader,
  makePatternForCallScan,
  makePatternForQueueScan,
  noopLogger,
  filterNullsAndObjects,
  CALL_SET: 'active-call-sids'
};
