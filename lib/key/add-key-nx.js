const {noopLogger} = require('../utils');
const debug = require('debug')('jambonz:realtimedb-helpers');

async function addKeyNx(client, logger, key, value, expires = 0) {
  logger = logger || noopLogger;
  try {
    const result = await client.setAsync(key, value, 'nx');
    debug(result, 'result from setnx key');
    if (result == 'OK' && expires) {
      client.expire(key, expires, (err, r) => {
        if (err) logger.error({err}, `Error setting expires for key ${key}`);
      });
    }
    return result;
  } catch (err) {
    debug(err, 'result from setnx key');
    logger.error(err, `addKey: error setnx ${key}`);
  }
}

module.exports = addKeyNx;
