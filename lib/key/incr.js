const {noopLogger} = require('../utils');
const debug = require('debug')('jambonz:realtimedb-helpers');

async function incrKey(client, logger, key, expires = 0) {
  logger = logger || noopLogger;
  try {
    const multi = await client
      .multi()
      .incr(key);
    if (expires) multi.expire(key, expires);
    const result = await multi.execAsync();
    debug(result, 'result from incrementing key');
    return result[0];
  } catch (err) {
    debug(err, 'result from setting key');
    logger.error(err, `addKey: error setting ${key}`);
  }
}

module.exports = incrKey;
