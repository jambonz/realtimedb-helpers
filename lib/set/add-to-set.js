const {noopLogger} = require('../utils');
const debug = require('debug')('jambonz:realtimedb-helpers');

async function addToSet(client, logger, setName, set) {
  logger = logger || noopLogger;
  set = set instanceof Set || Array.isArray(set) ? set : [set];
  try {
    const added = await client.saddAsync(setName, [...set]);
    debug(`addToSet: added ${added} members to ${setName}`);
    return added;
  } catch (err) {
    debug(err, `Error addToSet set for key ${setName}`);
    logger.error(err, `addToSet: Error creating set for key ${setName}`);
  }
}

module.exports = addToSet;
