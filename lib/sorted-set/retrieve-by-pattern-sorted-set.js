const {noopLogger} = require('../utils');
const { resolveSortedSetValue } = require('./utils');
const debug = require('debug')('jambonz:realtimedb-helpers');

async function retrieveByPatternSortedSet(client, logger, listName, pattern) {
  logger = logger || noopLogger;
  try {
    const ret = [];
    async function scan(cursor) {
      try {
        const res = await client.zscan(listName, cursor, 'MATCH', pattern);
        for (let i = 0; i < res[1].length; i += 2) {
          const item = res[1][i];
          await client.zrem(listName, item);
          ret.push(resolveSortedSetValue(item))
        }
        return res[0];  // return updated cursor
      } catch (err) {
        logger.error(err, 'Error scanning sorted call set');
        return '0';
      }
    }
    let cursor = '0';
    do {
      cursor = await scan(cursor);
    } while ('0' !== cursor);
    return ret;
  } catch (err) {
    debug(err, `retrieveByPatternSortedSet:Error scan from ${listName} for pattern ${pattern}`);
    logger.error(err, `retrieveByPatternSortedSet:Error scan from ${listName} for pattern ${pattern}`);
  }
}

module.exports = retrieveByPatternSortedSet;
