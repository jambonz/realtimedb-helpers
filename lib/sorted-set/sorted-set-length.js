const {noopLogger} = require('../utils');
const debug = require('debug')('jambonz:realtimedb-helpers');

async function sortedSetLength(client, logger, listName) {
  logger = logger || noopLogger;
  try {
    const result = await client.zcard(listName);
    return result;
  } catch (err) {
    debug(err, `Error getting ${listName} size`);
    logger.error(err, `Error getting ${listName} size`);
  }
}

module.exports = sortedSetLength;