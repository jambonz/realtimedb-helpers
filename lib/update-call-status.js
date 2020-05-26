const {makeCallKey, noopLogger, filterNulls, CALL_SET} = require('./utils');
const debug = require('debug')('jambonz:realtimedb-helpers');
const assert = require('assert');
const MAX_CALL_LIFETIME = 12 * 60 * 60;                 // calls live 12 hours max in redis
const MAX_CALL_LIFETIME_AFTER_COMPLETED = 1 * 60 * 60;  // or 1 hour after completion

// duck-type checking
function validateCallInfo(callInfo, serviceUrl) {
  assert(callInfo.callSid);
  assert(callInfo.callId);
  assert(callInfo.sipStatus);
  assert(callInfo.accountSid);
  assert([
    'trying',
    'ringing',
    'early-media',
    'in-progress',
    'completed',
    'failed',
    'busy',
    'no-answer',
    'queued'
  ].includes(callInfo.callStatus));
  assert(serviceUrl || callInfo.sipStatus !== 100);
}
async function updateCallStatus(client, logger, callInfo, serviceUrl) {
  logger = logger || noopLogger;
  debug({callInfo, serviceUrl}, 'updateCallStatus');
  try {
    validateCallInfo(callInfo, serviceUrl);
    const {accountSid, callSid} = callInfo;
    const key = makeCallKey(accountSid, callSid);
    const expires = callInfo.sipStatus >= 200 ? MAX_CALL_LIFETIME : MAX_CALL_LIFETIME_AFTER_COMPLETED;
    const obj = callInfo.sipStatus === 100 ? Object.assign({serviceUrl}, callInfo) : callInfo;

    // remove customer data
    delete obj._customerData;

    // remove null values
    const filtered = filterNulls(obj);

    debug({call: filtered}, `updateCallStatus setting with key: ${key}`);

    /**
     * add or update a key.
     * If adding, also add the call key to the sorted set of call keys, which is sorted by time it was added
     */
    const multi = await client
      .multi()
      .hmset(key, filtered)
      .expire(key, expires);

    if (callInfo.sipStatus === 100) {
      const score = Date.now();
      debug(`setting score for ${key} to ${score}`);
      multi.zadd(CALL_SET, score, key);
    }
    const result = await multi.execAsync();
    debug({filtered}, `updateCallStatus result: ${result}`);
    if (result[0] !== 'OK') logger.info({filtered}, `updateCallStatus result: ${result}`);
    return result[0] === 'OK';
  } catch (err) {
    debug(err, `Error adding call ${callInfo.callSid}`);
    logger.error(err, `Error adding call ${callInfo.callSid}`);
    return false;
  }
}

module.exports = updateCallStatus;
