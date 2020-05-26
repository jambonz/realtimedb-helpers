const {makePatternForCallScan, CALL_SET, noopLogger} = require('./utils');
const debug = require('debug')('jambonz:realtimedb-helpers');

async function listCallInfo(client, logger, accountSid) {
  logger = logger || noopLogger;
  try {
    const pattern = makePatternForCallScan(accountSid);
    const calls = [];

    debug(`listCallInfo: scanning with match ${pattern}`);
    async function scan(cursor) {
      try {
        const res = await client.zscanAsync(CALL_SET, cursor, 'MATCH', pattern);
        for (let i = 0; i < res[1].length; i += 2) {
          const key = res[1][i];
          const call = await client.hgetallAsync(key);
          if (call) calls.push(call);
          else await client.zrem(CALL_SET, key);
        }
        return res[0];  // return updated cursor
      } catch (err) {
        logger.error(err, 'Error scanning sorted call set');
        return '0';
      }
    }

    let cursor = '0';
    do {
      cursor = await scan(cursor);
    } while ('0' !== cursor);

    debug(`listCallInfo retrieved ${calls.length} calls`);
    logger.debug(`listCallInfo retrieved ${calls.length} calls`);
    return calls;
  } catch (err) {
    debug(err, `listCallInfo: Error retrieving calls for account sid ${accountSid}`);
    logger.error(err, `listCallInfo: Error retrieving calls for account sid ${accountSid}`);
  }
}

module.exports = listCallInfo;
