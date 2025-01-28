const {noopLogger, makePatternForConferenceScan} = require('./lib/utils');
const Redis = require('ioredis');
const fs = require('fs');

let JAMBONES_REDIS_CONFIGURATION = process.env.JAMBONES_REDIS_SENTINELS ? {
  sentinels: process.env.JAMBONES_REDIS_SENTINELS.split(',').map((sentinel) => {
    let host, port = 26379;
    if (sentinel.includes(':')) {
      const arr = sentinel.split(':');
      host = arr[0];
      port = parseInt(arr[1], 10);
    } else {
      host = sentinel;
    }
    return {host, port};
  }),
  name: process.env.JAMBONES_REDIS_SENTINEL_MASTER_NAME,
  ...(process.env.JAMBONES_REDIS_SENTINEL_PASSWORD && {
    password: process.env.JAMBONES_REDIS_SENTINEL_PASSWORD
  }),
  ...(process.env.JAMBONES_REDIS_SENTINEL_USERNAME && {
    username: process.env.JAMBONES_REDIS_SENTINEL_USERNAME
  }),
  ...(process.env.JAMBONES_REDIS_SENTINEL_SERVER_PASSWORD && {
    sentinelPassword: process.env.JAMBONES_REDIS_SENTINEL_SERVER_PASSWORD
  }),
} : {
  host: process.env.JAMBONES_REDIS_HOST || 'localhost',
  port: process.env.JAMBONES_REDIS_PORT || 6379,
  ...(process.env.JAMBONES_REDIS_USERNAME && {username: process.env.JAMBONES_REDIS_USERNAME}),
	...(process.env.JAMBONES_REDIS_PASSWORD && {password: process.env.JAMBONES_REDIS_PASSWORD}),
};
if (process.env.ENABLE_JAMBONES_REDIS_TLS) {
  JAMBONES_REDIS_CONFIGURATION = {
    ...JAMBONES_REDIS_CONFIGURATION,
    tls: {
      ...(process.env.JAMBONES_REDIS_TLS_CA_FILE && {
        ca: fs.readFileSync(process.env.JAMBONES_REDIS_TLS_CA_FILE)}),
      ...(process.env.JAMBONES_REDIS_TLS_KEY_FILE && {
        key: fs.readFileSync(process.env.JAMBONES_REDIS_TLS_KEY_FILE)
      }),
      ...(process.env.JAMBONES_REDIS_TLS_CERT_FILE && {
        cert: fs.readFileSync(process.env.JAMBONES_REDIS_TLS_CERT_FILE)
      })
    }
  };
}


module.exports = (opts, logger) => {
  logger = logger || noopLogger;
  const connectionOpts = (!!opts && Object.keys(opts).length > 0) ? {...opts} : JAMBONES_REDIS_CONFIGURATION;

  const client = new Redis(connectionOpts);
  ['ready', 'connect', 'reconnecting', 'error', 'end', 'warning']
    .forEach((event) => {
      client.on(event, (...args) => {
        if ('error' === event) {
          if (process.env.NODE_ENV === 'test' && args[0]?.code === 'ECONNREFUSED') return;
          logger.error({...args}, '@jambonz/realtimedb-helpers - redis error');
        }
        else logger.debug({args}, `redis event ${event}`);
      });
    });

  return {
    client,
    updateCallStatus: require('./lib/update-call-status').bind(null, client, logger),
    retrieveCall: require('./lib/retrieve-call').bind(null, client, logger),
    deleteCall: require('./lib/delete-call').bind(null, client, logger),
    listCalls: require('./lib/list-calls').bind(null, client, logger),
    listQueues: require('./lib/list-queues').bind(null, client, logger),
    listConferences: require('./lib/hash/list-hash').bind(null, client, logger, makePatternForConferenceScan, 'conf'),
    purgeCalls: require('./lib/purge-calls').bind(null, client, logger),
    createSet: require('./lib/set/create-set').bind(null, client, logger),
    addToSet: require('./lib/set/add-to-set').bind(null, client, logger),
    removeFromSet: require('./lib/set/remove-from-set').bind(null, client, logger),
    retrieveSet: require('./lib/set/retrieve-set').bind(null, client, logger),
    monitorSet: require('./lib/set/monitor-set').bind(null, client, logger),
    isMemberOfSet: require('./lib/set/is-member-of-set').bind(null, client, logger),
    createHash: require('./lib/hash/create-hash').bind(null, client, logger),
    retrieveHash: require('./lib/hash/retrieve-hash').bind(null, client, logger),
    addKey: require('./lib/key/add-key').bind(null, client, logger),
    addKeyNx: require('./lib/key/add-key-nx').bind(null, client, logger),
    retrieveKey: require('./lib/key/retrieve-key').bind(null, client, logger),
    deleteKey: require('./lib/key/delete-key').bind(null, client, logger),
    incrKey: require('./lib/key/incr').bind(null, client, logger),
    decrKey: require('./lib/key/decr').bind(null, client, logger),
    decrKeyIfExists: require('./lib/key/decr-key-if-exists').bind(null, client, logger),
    pushBack: require('./lib/list/push-back').bind(null, client, logger),
    lengthOfList: require('./lib/list/length').bind(null, client, logger),
    getListPosition: require('./lib/list/position').bind(null, client, logger),
    popFront: require('./lib/list/pop-front').bind(null, client, logger),
    removeFromList: require('./lib/list/remove').bind(null, client, logger),
    addToSortedSet: require('./lib/sorted-set/add-to-sorted-set').bind(null, client, logger),
    retrieveFromSortedSet: require('./lib/sorted-set/retrieve-sorted-set').bind(null, client, logger),
    sortedSetLength: require('./lib/sorted-set/sorted-set-length').bind(null, client, logger),
    retrieveByPatternSortedSet: require('./lib/sorted-set/retrieve-by-pattern-sorted-set').bind(null, client, logger),
    sortedSetPositionByPattern: require('./lib/sorted-set/sorted-set-position').bind(null, client, logger),
    listSortedSets: require('./lib/sorted-set/list-sorted-sets').bind(null, client, logger),
  };
};
