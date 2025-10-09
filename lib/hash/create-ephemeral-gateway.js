const {noopLogger} = require('../utils');
const debug = require('debug')('jambonz:realtimedb-helpers');

async function createEphemeralGateway(client, logger, ipAddress, voipCarrierSid, ttlSeconds) {
  logger = logger || noopLogger;
  const key = `eph-gw-ip:${ipAddress}`;
  const expiryTimestamp = Math.floor(Date.now() / 1000) + ttlSeconds;

  const multi = client.multi();

  // Use HSET (not HSETNX) to allow updates
  multi.hset(key, voipCarrierSid, expiryTimestamp);

  // Optional: Set conservative key expiry
  multi.expire(key, 7200);

  return new Promise((resolve, reject) => {
    multi.exec((err, results) => {
      if (err) {
        logger.error({err}, `createEphemeralGateway: error for ${key}`);
        return reject(err);
      }
      debug({voipCarrierSid, ipAddress, ttlSeconds, results}, `createEphemeralGateway: created ${key}`);
      resolve(true);
    });
  });
}

module.exports = createEphemeralGateway;
