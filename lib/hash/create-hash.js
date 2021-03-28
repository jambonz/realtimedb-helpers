const {noopLogger} = require('../utils');
const debug = require('debug')('jambonz:realtimedb-helpers');

function createHash(client, logger, key, obj, expiry = 0) {
  logger = logger || noopLogger;
  const multi = client.multi();
  for (const i of Object.entries(obj)) {
    if (i[1] !== null) multi.hsetnx(key, i);
  }
  if (expiry) multi.expire(key, expiry);

  return new Promise((resolve, reject) => {
    client.watch(key, (err) => {
      if (err) {
        logger.error(err, `createHash: error watching key ${key}`);
        return reject(err);
      }
      multi.exec((err, results) => {
        if (err) {
          logger.error({err, obj}, `createHash: error setting values for key ${key}`);
          return reject(err);
        }
        if (results === null) {
          logger.info(`createHash: failed to create hash for key ${key}; someone got there first`);
          return resolve(false);
        }
        const count = results.reduce((acc, value) => acc + value, 0);
        debug({results, count}, 'createHash: results');
        resolve(count > 0);
      });
    });
  });
}

module.exports = createHash;
