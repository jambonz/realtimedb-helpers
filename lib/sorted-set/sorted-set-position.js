const {noopLogger} = require('../utils');
const debug = require('debug')('jambonz:realtimedb-helpers');

async function sortedSetPositionByPattern(client, logger, listName, pattern) {
  logger = logger || noopLogger;
  try {
    const ret = [];
    async function scan(cursor) {
      try {
        const res = await client.zscan(listName, cursor, 'MATCH', pattern);
        for (let i = 0; i < res[1].length; i += 2) {
          const item = res[1][i];
          ret.push(item);
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
    return await Promise.all(ret.map(async(e) => client.zrank(listName, e)));
  } catch (err) {
    debug(err, `sortedSetPositionByPattern:Error positioning from ${listName} for pattern ${pattern}`);
    logger.error(err, `sortedSetPositionByPattern:Error positioning from ${listName} for pattern ${pattern}`);
  }
}

module.exports = sortedSetPositionByPattern;
