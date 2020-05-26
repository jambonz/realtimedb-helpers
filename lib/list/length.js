const {noopLogger} = require('../utils');
const debug = require('debug')('jambonz:realtimedb-helpers');

async function length(client, logger, listName) {
  logger = logger || noopLogger;
  try {
    const result = await client.llenAsync(listName);
    debug({result}, `length: ${listName}`);
    return result;
  } catch (err) {
    debug(err, `Error getting length of list ${listName}`);
    logger.error(err, `length: Error getting length list ${listName}`);
  }
}

module.exports = length;
