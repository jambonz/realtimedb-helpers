const assert = require('assert');

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

function makeCallKey(accountSid, callSid) {
  return `call:${accountSid}:${callSid}`;
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
  makeBasicAuthHeader,
  makePatternForCallScan,
  makePatternForQueueScan,
  noopLogger,
  filterNullsAndObjects,
  CALL_SET: 'active-call-sids',
  PURGE_CALLS_LOCK_KEY: 'purge-calls-lock'
};
