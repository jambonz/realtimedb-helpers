const assert = require('assert');
const crypto = require('crypto');
const debug = require('debug')('jambonz:realtimedb-helpers');

function makeCallKey(accountSid, callSid) {
  return `call:${accountSid}:${callSid}`;
}

function makeSynthKey(vendor, language, voice, text) {
  const hash = crypto.createHash('sha1');
  hash.update(`${language}:${vendor}:${voice}:${text}`);
  return `tts:${hash.digest('hex')}`;
}

function makePatternForCallScan(accountSid) {
  return `call:${accountSid}:*`;
}

const noopLogger = {
  info: () => {},
  debug: () => {},
  error: () => {}
};

function filterNulls(obj) {
  debug(obj, 'filtering start');
  assert(typeof obj === 'object' && obj !== null);
  const filtered = Object.keys(obj)
    .filter((key) => obj[key] !== null && typeof obj[key] !== 'undefined')
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
  makePatternForCallScan,
  noopLogger,
  filterNulls,
  CALL_SET: 'active-call-sids'
};
