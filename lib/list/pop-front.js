const {noopLogger} = require('../utils');
const debug = require('debug')('jambonz:realtimedb-helpers');

async function popFront(client, logger, listName) {
  logger = logger || noopLogger;
  try {
    const result = await client.lpopAsync(listName);
    debug({result}, `popFront: ${listName}`);
    return result;
  } catch (err) {
    debug(err, `Error popping from ${listName}`);
    logger.error(err, `popFront: Error popping from list ${listName}`);
  }
}

module.exports = popFront;
