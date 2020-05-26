const {noopLogger} = require('../utils');
const debug = require('debug')('jambonz:realtimedb-helpers');

async function position(client, logger, listName, item) {
  logger = logger || noopLogger;
  try {
    const items = await client.lrangeAsync(listName, 0, -1);
    return items.findIndex((i) => i === item);
  } catch (err) {
    debug(err, `Error getting position of ${item} in list ${listName}`);
    logger.error(err, `length: Error getting position of item ${item} list ${listName}`);
  }
}

module.exports = position;
