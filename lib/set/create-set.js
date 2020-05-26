const {noopLogger} = require('../utils');
const debug = require('debug')('jambonz:realtimedb-helpers');

async function createSet(client, logger, setName, set, deleteIfExists = false) {
  logger = logger || noopLogger;
  try {
    const result = await client.multi()
      .del(setName)
      .sadd(setName, [...set])
      .execAsync();
    const added = result[1];
    logger.debug({result}, `createSet for key ${setName} added ${added}`);
    debug({result}, `createSet: ${setName}`);
    return added;
  } catch (err) {
    debug(err, `Error creating set for key ${setName}`);
    logger.error(err, `createSet: Error creating set for key ${setName}`);
  }
}

module.exports = createSet;
