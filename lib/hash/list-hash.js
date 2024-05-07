const { noopLogger} = require('../utils');
const debug = require('debug')('jambonz:realtimedb-helpers');

const scan = async(client, logger, cursor, pattern) => {
  try {
    const res = await client.scan(cursor, 'MATCH', pattern);
    debug(`scanned pattern ${pattern} cursor ${cursor} result: ${JSON.stringify(res)}`);
    return {next: res[0], matches: res[1]};  // return updated cursor
  } catch (err) {
    logger.error(err, `Error scanning ${pattern}`);
    return {next: '0'};
  }
};

async function listHashes(client, logger, createPatternForScan, hashPrefix, accountSid, glob) {
  logger = logger || noopLogger;
  let cursor = '0';
  const pattern = createPatternForScan(accountSid, glob);
  const hashes = [];
  try {
    debug(`listHashes: scanning with match ${pattern}`);
    do {
      const {next, matches} = await scan(client, logger, cursor, pattern);
      if (matches.length > 0) hashes.push.apply(hashes, matches);
      cursor = next;
    } while ('0' !== cursor);

    logger.debug(`listHashes retrieved ${hashes.length} ${hashPrefix}`);

    return hashes;
  } catch (err) {
    debug(err, `listHashes: Error retrieving ${hashPrefix} for account sid ${accountSid}`);
    logger.error(err, `listHashes: Error retrieving ${hashPrefix} for account sid ${accountSid}`);
  }
}

module.exports = listHashes;
