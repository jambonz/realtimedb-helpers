const {makeCallKey, noopLogger} = require('./utils');
const debug = require('debug')('jambonz:realtimedb-helpers');

async function retrieveCallInfo(client, logger, accountSid, callSid) {
  logger = logger || noopLogger;
  try {
    const key = makeCallKey(accountSid, callSid);
    const result = await client.hgetallAsync(key);
    logger.info({result}, `retrieveCallInfo for callSid ${callSid}`);
    debug({result}, `retrieveCallInfo: ${callSid}`);
    return result;
  } catch (err) {
    debug(err, `Error retrieving call for callSid ${callSid}`);
    logger.error(err, `retrieveCallInfo: Error account_sid ${accountSid} call_sid ${callSid}`);
  }
}

module.exports = retrieveCallInfo;
