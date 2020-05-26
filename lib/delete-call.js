const {makeCallKey, CALL_SET, noopLogger} = require('./utils');
const debug = require('debug')('jambonz:realtimedb-helpers');

async function deleteCall(client, logger, accountSid, callSid) {
  logger = logger || noopLogger;
  try {
    const key = makeCallKey(accountSid, callSid);
    const result = await client
      .multi()
      .del(key)
      .zrem(CALL_SET, key)
      .execAsync();
    logger.info({result}, `deleteCall for key ${key}`);
    debug({result}, `deleteCall: ${callSid}`);
    return Array.isArray(result) && result.length > 0 && result[0] === 1;
  } catch (err) {
    debug(err, `Error deleting call for callSid ${callSid}`);
    logger.error(err, `deleteCall: Error account_sid ${accountSid} call_sid ${callSid}`);
  }
  return false;
}

module.exports = deleteCall;
