const {noopLogger} = require('../utils');
const debug = require('debug')('jambonz:realtimedb-helpers');

async function deleteEphemeralGateway(client, logger, ipAddress, voipCarrierSid) {
  logger = logger || noopLogger;
  const key = `eph-gw-ip:${ipAddress}`;

  return new Promise((resolve, reject) => {
    client.hdel(key, voipCarrierSid, (err, deletedCount) => {
      if (err) {
        logger.error({err}, `deleteEphemeralGateway: error deleting ${voipCarrierSid} from ${key}`);
        return reject(err);
      }

      if (deletedCount === 0) {
        debug({voipCarrierSid, ipAddress}, `deleteEphemeralGateway: carrier not found in ${key}`);
        return resolve(false);
      }

      debug({voipCarrierSid, ipAddress, deletedCount}, `deleteEphemeralGateway: removed ${voipCarrierSid} from ${key}`);

      // Check if hash is now empty and clean up if so
      client.hlen(key, (err, length) => {
        if (err) {
          logger.error({err}, `deleteEphemeralGateway: error checking length of ${key}`);
          return resolve(true); // Still return success since deletion worked
        }

        if (length === 0) {
          // Hash is empty, delete the key entirely
          client.del(key, (err) => {
            if (err) {
              logger.error({err}, `deleteEphemeralGateway: error deleting empty key ${key}`);
            } else {
              debug({ipAddress}, `deleteEphemeralGateway: cleaned up empty key ${key}`);
            }
            resolve(true);
          });
        } else {
          resolve(true);
        }
      });
    });
  });
}

module.exports = deleteEphemeralGateway;
