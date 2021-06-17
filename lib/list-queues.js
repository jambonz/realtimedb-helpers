const {makePatternForQueueScan, noopLogger} = require('./utils');
const debug = require('debug')('jambonz:realtimedb-helpers');

const scan = async(client, logger, cursor, pattern) => {
  try {
    const res = await client.scanAsync(cursor, 'MATCH', pattern);
    debug(`scanned pattern ${pattern} cursor ${cursor} result: ${JSON.stringify(res)}`);
    return {next: res[0], matches: res[1]};  // return updated cursor
  } catch (err) {
    logger.error(err, 'Error scanning queues');
    return {next: '0'};
  }
};

async function listQueues(client, logger, accountSid, glob) {
  logger = logger || noopLogger;
  let cursor = '0';
  const pattern = makePatternForQueueScan(accountSid, glob);
  const queues = [];
  try {
    debug(`listQueues: scanning with match ${pattern}`);
    do {
      const {next, matches} = await scan(client, logger, cursor, pattern);
      if (matches.length > 0) queues.push.apply(queues, matches);
      cursor = next;
    } while ('0' !== cursor);

    debug(`listQueues retrieved ${queues.length} queues: ${JSON.stringify()}`);
    logger.debug(`listQueues retrieved ${queues.length} queues`);

    const arr = queues.map((q) => {
      return new Promise((resolve, reject) => {
        const arr = /^queue:.*:(.*)$/.exec(q);
        if (!arr) return reject(`invalid queue name: ${q}`);
        client.llenAsync(q)
          .then((length) => resolve({name: arr[1], length}))
          .catch((err) => reject(err));
      });
    });

    return await Promise.all(arr);
  } catch (err) {
    debug(err, `listQueues: Error retrieving queues for account sid ${accountSid}`);
    logger.error(err, `listQueues: Error retrieving queues for account sid ${accountSid}`);
  }
}

module.exports = listQueues;
