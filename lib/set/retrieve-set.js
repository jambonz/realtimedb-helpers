const {noopLogger} = require('../utils');
const debug = require('debug')('jambonz:realtimedb-helpers');

async function retrieveSet(client, logger, setName) {
  logger = logger || noopLogger;
  try {
    const result = await client.smembersAsync(setName);
    logger.debug({result}, `retrieveSet for key ${setName}`);
    debug({result}, `retrieveSet: ${setName}`);
    return result;
  } catch (err) {
    debug(err, `Error retrieving set for key ${setName}`);
    logger.error(err, `retrieveCallInfo: Error retrieving set for key ${setName}`);
  }
}

module.exports = retrieveSet;
