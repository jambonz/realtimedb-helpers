const {noopLogger} = require('../utils');
const debug = require('debug')('jambonz:realtimedb-helpers');

async function pushBack(client, logger, listName, item) {
  logger = logger || noopLogger;
  try {
    const result = await client.rpushAsync(listName, item);
    debug({result, item}, `pushBack: ${listName}`);
    return result;
  } catch (err) {
    debug(err, `Error pushing item ${item} onto list ${listName}`);
    logger.error(err, `pushBack: Error pushing item to list ${listName}`);
  }
}

module.exports = pushBack;
