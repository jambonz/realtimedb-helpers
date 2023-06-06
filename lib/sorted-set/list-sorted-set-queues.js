const {makePatternForQueueScan, noopLogger} = require('../utils');
const debug = require('debug')('jambonz:realtimedb-helpers');

const scan = async(client, logger, cursor, pattern) => {
  try {
    const res = await client.scan(cursor, 'MATCH', pattern);
    debug(`scanned pattern ${pattern} cursor ${cursor} result: ${JSON.stringify(res)}`);
    return {next: res[0], matches: res[1]};  // return updated cursor
  } catch (err) {
    logger.error(err, 'Error scanning queues');
    return {next: '0'};
  }
};

async function listSortedSetQueues(client, logger, accountSid, glob) {
  logger = logger || noopLogger;
  let cursor = '0';
  const pattern = makePatternForQueueScan(accountSid, glob);
  const queues = [];
  try {
    debug(`listSortedSetQueues: scanning with match ${pattern}`);
    do {
      const {next, matches} = await scan(client, logger, cursor, pattern);
      if (matches.length > 0) queues.push.apply(queues, matches);
      cursor = next;
    } while ('0' !== cursor);

    debug(`listSortedSetQueues retrieved ${queues.length} queues`);
    logger.debug(`listSortedSetQueues retrieved ${queues.length} queues`);

    const arr = queues.map((qName) => {
      return new Promise((resolve, reject) => {
        const arr = /^queue:.*:(.*)$/.exec(qName);
        if (!arr) return reject(`invalid queue name: ${qName}`);

        client.zrange(qName, 0, -1)
          .then((queue) => resolve({name: arr[1], length: queue.length}))
          .catch((err) => reject(err));
      });
    });

    return Promise.all(arr);
  } catch (err) {
    debug(err, `listSortedSetQueues: Error retrieving queues for account sid ${accountSid}`);
    logger.error(err, `listSortedSetQueues: Error retrieving queues for account sid ${accountSid}`);
  }
}

module.exports = listSortedSetQueues;
