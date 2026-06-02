const {CALL_SET, PURGE_CALLS_LOCK_KEY, noopLogger} = require('./utils');
const debug = require('debug')('jambonz:realtimedb-helpers');

/**
 *  Scan CALL_SET and remove any members that don't exist as a key
 */
async function purgeCalls(client, logger) {
  logger = logger || noopLogger;
  let purgedCount = 0;
  try {
    // set run lock
    const result = await client.set(PURGE_CALLS_LOCK_KEY, 'locked', 'NX', 'EX', 1 * 60);
    if (!result) {
      return;
    }
    const count = await client.zcard(CALL_SET);
    debug(`purgeCalls: scanning ${count} members of active call set`);
    logger.info(`purgeCalls: scanning ${count} members of active call set`);

    async function scan(cursor) {
      try {
        const res = await client.zscan([CALL_SET, cursor, 'COUNT', 500]);
        const keys = [];
        for (let i = 0; i < res[1].length; i += 2) {
          keys.push(res[1][i]);
        }

        if (keys.length) {
          // Pipeline EXISTS checks - single round-trip for entire batch
          const pipeline = client.pipeline();
          keys.forEach((key) => pipeline.exists(key));
          const results = await pipeline.exec();

          const dead = [];
          results.forEach((result, idx) => {
            // result is [err, value] - value is 0 if key doesn't exist
            if (!result[0] && !result[1]) {
              dead.push(keys[idx]);
            }
          });

          if (dead.length) {
            debug(`purgeCalls: removing ${dead.length} dead keys from batch of ${keys.length}`);
            const removed = await client.zrem(CALL_SET, dead);
            logger.debug(`purgeCalls: removed ${removed} keys`);
            purgedCount += dead.length;
          }
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
    await client.del(PURGE_CALLS_LOCK_KEY);
  } catch (err) {
    debug(err, 'purgeCalls: Error');
    logger.error(err, 'purgeCalls: Error');
  }
  logger.info(`purgeCalls: purged ${purgedCount} from active call set`);
  return purgedCount;
}

module.exports = purgeCalls;
