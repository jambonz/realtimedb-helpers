const {CALL_SET, noopLogger} = require('./utils');
const debug = require('debug')('jambonz:realtimedb-helpers');

/**
 *  Scan CALL_SET and remove any members that don't exist as a key
 */
async function purgeCalls(client, logger) {
  logger = logger || noopLogger;
  let purgedCount = 0;
  try {
    const dead = [];
    const count = await client.zcardAsync(CALL_SET);
    debug(`purgeCalls: scanning ${count} members of active call set`);
    logger.info(`purgeCalls: scanning ${count} members of active call set`);

    async function scan(cursor) {
      try {
        const res = await client.zscanAsync([CALL_SET, cursor, 'COUNT', 500]);
        for (let i = 0; i < res[1].length; i += 2) {
          const key = res[1][i];
          const exists = await client.existsAsync(key);
          debug(`key ${key} exists: ${exists}`);
          if (!exists) dead.push(key);
        }

        if (dead.length) {
          logger.info(`purgeCalls: removing ${dead.length} keys`);
          const result = await client.zrem(CALL_SET, dead);
          logger.debug(`purgeCalls: removed ${result} keys`);
          purgedCount += dead.length;
        }
        return res[0];  // return updated cursor
      } catch (err) {
        logger.error(err, 'Error scanning sorted call set');
        debug(err, 'Error scanning sorted call set');
        return '0';
      }
    }

    let cursor = '0';
    do {
      cursor = await scan(cursor);
    } while ('0' !== cursor);
  } catch (err) {
    debug(err, 'purgeCalls: Error');
    logger.error(err, 'purgeCalls: Error');
  }
  logger.info(`purgeCalls: purged ${purgedCount} from active call set`);
  return purgedCount;
}

module.exports = purgeCalls;
