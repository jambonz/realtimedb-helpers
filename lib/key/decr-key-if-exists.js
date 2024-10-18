const { noopLogger } = require('../utils');
const debug = require('debug')('jambonz:realtimedb-helpers');

async function decrKeyIfExists(client, logger, key, expires = 0) {
  logger = logger || noopLogger;
  try {
    const exists = await client.exists(key);
    if (!exists) { return 0; }

    const result = await client.decr(key);
    debug(result, `result from decrementing key ${key}`);
    return result;
  } catch (err) {
    debug(err, 'result from decrementing key');
    logger.error(err, `addKey: error decrementing ${key}`);
  }
}

module.exports = decrKeyIfExists;
