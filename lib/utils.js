const assert = require('assert');
/**
 * Future TODO: cache recently used connections to providers
 * to avoid connection overhead during a call.
 * Will need to periodically age them out to avoid memory leaks.
 */
//const nuanceClientMap = new Map();

const debug = require('debug')('jambonz:realtimedb-helpers');

function makeCallKey(accountSid, callSid) {
  return `call:${accountSid}:${callSid}`;
}

function makePatternForCallScan(accountSid) {
  return `call:${accountSid}:*`;
}
function makePatternForQueueScan(accountSid, pattern) {
  return `queue:${accountSid}:${pattern || '*'}`;
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
  makePatternForCallScan,
  makePatternForQueueScan,
  noopLogger,
  filterNullsAndObjects,
  CALL_SET: 'active-call-sids'
};
