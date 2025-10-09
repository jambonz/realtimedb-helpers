const {noopLogger} = require('../utils');
const debug = require('debug')('jambonz:realtimedb-helpers');

async function queryEphemeralGateways(client, logger, ipAddress) {
  logger = logger || noopLogger;
  const key = `eph-gw-ip:${ipAddress}`;

  try {
    const results = await client.hgetall(key);
    debug({results, ipAddress}, `queryEphemeralGateways for ${key}`);

    if (!results || Object.keys(results).length === 0) {
      return [];
    }

    // Filter out expired entries and remove them from Redis
    const now = Math.floor(Date.now() / 1000);
    const activeCarriers = [];
    const expiredCarriers = [];

    for (const [voipCarrierSid, expiryTimestamp] of Object.entries(results)) {
      const expiry = parseInt(expiryTimestamp);
      if (expiry > now) {
        activeCarriers.push(voipCarrierSid);
      } else {
        expiredCarriers.push(voipCarrierSid);
        debug({voipCarrierSid, expiryTimestamp, now}, `queryEphemeralGateways: expired entry for ${key}`);
      }
    }

    // Remove expired entries from Redis
    if (expiredCarriers.length > 0) {
      await client.hdel(key, ...expiredCarriers);
      debug({expiredCarriers, ipAddress}, `queryEphemeralGateways: removed expired entries from ${key}`);
    }

    return activeCarriers;
  } catch (err) {
    logger.error({err, ipAddress}, `queryEphemeralGateways: error for ${key}`);
    throw err;
  }
}

module.exports = queryEphemeralGateways;