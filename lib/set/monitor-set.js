const {noopLogger} = require('../utils');
const debug = require('debug')('jambonz:realtimedb-helpers');
const assert = require('assert');

const equalsIgnoreOrder = (a, b) => {
  if (a.length !== b.length) return false;
  const uniqueValues = new Set([...a, ...b]);
  for (const v of uniqueValues) {
    const aCount = a.filter((e) => e === v).length;
    const bCount = b.filter((e) => e === v).length;
    if (aCount !== bCount) return false;
  }
  return true;
};

async function monitorSet(client, logger, setName, interval, callback) {
  assert.ok(Number.isInteger(interval), `monitorSet: interval is not an integer: ${interval}`);
  assert.ok(typeof callback === 'function', 'monitorSet: callback function was not supplied');

  try {
    logger = logger || noopLogger;
    interval = process.env.NODE_ENV === 'test' ? (interval * 1000) : Math.max(10, interval) * 1000;

    /* initial check */
    let members = await client.smembersAsync(setName);
    callback(members);

    /* periodically re-check */
    setInterval(async() => {
      const latest = await client.smembersAsync(setName);
      debug(`monitoring: latest is ${latest}, previously was ${members}`);
      if (!equalsIgnoreOrder(latest, members)) {
        members = latest;
        callback(members);
      }
    }, interval);
  } catch (err) {
    debug(err, `monitorSet: Error monitoring ${setName}`);
    logger.error(err, `monitorSet: Error monitoring ${setName}`);
  }
}

module.exports = monitorSet;

