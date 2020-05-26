const {noopLogger} = require('../utils');
const debug = require('debug')('jambonz:realtimedb-helpers');

async function removeFromSet(client, logger, setName, set) {
  logger = logger || noopLogger;
  set = set instanceof Set || Array.isArray(set) ? set : [set];
  try {
    const removed = await client.sremAsync(setName, [...set]);
    debug(`removeFromSet: removed ${removed} members from ${setName}`);
    return removed;
  } catch (err) {
    debug(err, `Error removeFromSet set for key ${setName}`);
    logger.error(err, `removeFromSet: Error remove from set ${setName}`);
  }
}

module.exports = removeFromSet;
