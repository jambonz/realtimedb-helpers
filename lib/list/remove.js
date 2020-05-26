const {noopLogger} = require('../utils');
const debug = require('debug')('jambonz:realtimedb-helpers');

async function remove(client, logger, listName, item) {
  logger = logger || noopLogger;
  try {
    const result = await client.lremAsync(listName, 0, item);
    debug({result, item}, `remove: ${listName}`);
    return result;
  } catch (err) {
    debug(err, `Error removing item ${item} from list ${listName}`);
    logger.error(err, `remove: Error removing item ${item} from list ${listName}`);
  }
}

module.exports = remove;
