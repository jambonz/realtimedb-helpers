const {noopLogger} = require('../utils');
const { generateSortedSetValue } = require('./utils');
const debug = require('debug')('jambonz:realtimedb-helpers');

async function addToSortedSet(client, logger, listName, item, priority = 999) {
  logger = logger || noopLogger;
  try {
    const result = await client.zadd(listName, priority >= 0 ? priority : 999, generateSortedSetValue(item));
    debug({result, item}, `addToSortedSet: ${listName}`);
    return result;
  } catch (err) {
    debug(err, `Error pushing item ${item} onto sorted set ${listName} with priority ${priority}`);
    logger.error(err, `Error pushing item ${item} onto sorted set ${listName} with priority ${priority}`);
  }
}

module.exports = addToSortedSet;
