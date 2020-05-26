const {noopLogger} = require('../utils');
const debug = require('debug')('jambonz:realtimedb-helpers');

async function addKey(client, logger, key, value, expires = 0) {
  logger = logger || noopLogger;
  try {
    const result = expires ?
      await client.setexAsync(key, expires, value) :
      await client.setAsync(key, value);
    debug(result, 'result from setting key');
    return result;
  } catch (err) {
    debug(err, 'result from setting key');
    logger.error(err, `addKey: error setting ${key}`);
  }
}

module.exports = addKey;
