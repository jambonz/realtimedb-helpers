const {noopLogger} = require('../utils');
const { resolveSortedSetValue } = require('./utils');
const debug = require('debug')('jambonz:realtimedb-helpers');

async function retrieveSortedSet(client, logger, listName) {
  logger = logger || noopLogger;
  try {
    let [result] = await client.zrange(listName, 0, 0);
    debug({result}, `retrieveSortedSet: ${listName}`);
    if (result) {
      await client.zrem(listName, result);
      result = resolveSortedSetValue(result);
    }
    return result;
  } catch (err) {
    debug(err, `Error popping from ${listName}`);
    logger.error(err, `retrieveSortedSet: Error popping from list ${listName}`);
  }
}

module.exports = retrieveSortedSet;
