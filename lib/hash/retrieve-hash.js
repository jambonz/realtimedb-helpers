const {noopLogger} = require('../utils');
const debug = require('debug')('jambonz:realtimedb-helpers');

async function retrieveHash(client, logger, key) {
  logger = logger || noopLogger;

  try {
    const results = await client.hgetallAsync(key);
    logger.debug({results}, `retrieveHash for key ${key}`);
    debug({results}, `retrieveHash for key ${key}`);
    return results;
  } catch (err) {
    logger.error(err, `Error retrieving hash for key ${key}`);
  }
}

module.exports = retrieveHash;
