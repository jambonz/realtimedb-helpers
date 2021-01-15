const {noopLogger} = require('../utils');
const debug = require('debug')('jambonz:realtimedb-helpers');

async function decrKey(client, logger, key, expires = 0) {
  logger = logger || noopLogger;
  try {
    const result = await client.decrAsync(key);
    debug(result, `result from decrementing key ${key}`);
    return result;
  } catch (err) {
    debug(err, 'result from decrementing key');
    logger.error(err, `addKey: error decrementing ${key}`);
  }
}

module.exports = decrKey;
