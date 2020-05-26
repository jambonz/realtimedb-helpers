const {noopLogger} = require('../utils');
const debug = require('debug')('jambonz:realtimedb-helpers');

async function deleteKey(client, logger, key) {
  logger = logger || noopLogger;
  try {
    const result = await client.delAsync(key);
    debug(result, 'result from deleting key');
    return result === 1;
  } catch (err) {
    logger.error(err, `deleteKey: error deleting ${key}`);
    return false;
  }
}

module.exports = deleteKey;
