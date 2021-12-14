const {noopLogger} = require('../utils');
const debug = require('debug')('jambonz:realtimedb-helpers');

async function isMemberOfSet(client, logger, setName, key) {
  logger = logger || noopLogger;
  try {
    const exists = await client.sismemberAsync(setName, key);
    debug(`isMemberOfSet: is ${key} in ${setName}? ${exists}`);
    return exists;
  } catch (err) {
    debug(err, `Error isMemberOfSet set ${setName} key ${key}`);
    logger.error(err, `isMemberOfSet: Error checking set ${setName} for key ${key}`);
  }
}

module.exports = isMemberOfSet;
