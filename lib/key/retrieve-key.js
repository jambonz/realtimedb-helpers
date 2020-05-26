const {noopLogger} = require('../utils');
const debug = require('debug')('jambonz:realtimedb-helpers');

async function retrieveKey(client, logger, key) {
  logger = logger || noopLogger;
  try {
    const result = await client.getAsync(key);
    debug(result, 'result from retrieveKey key');
    return result;
  } catch (err) {
    logger.error(err, `retrieveKey: error retrieve ${key}`);
  }
}

module.exports = retrieveKey;
