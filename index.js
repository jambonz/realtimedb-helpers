const {noopLogger} = require('./lib/utils');
const promisify = require('@jambonz/promisify-redis');
const redis = promisify(require('redis'));

module.exports = (opts, logger) => {
  const {host = '127.0.0.1', port = 6379, tls = false} = opts;
  logger = logger || noopLogger;

  const url = process.env.JAMBONES_REDIS_USERNAME && process.env.JAMBONES_REDIS_PASSWORD ?
    `${process.env.JAMBONES_REDIS_USERNAME}:${process.env.JAMBONES_REDIS_PASSWORD}@${host}:${port}` :
    `${host}:${port}`;
  const client = redis.createClient(tls ? `rediss://${url}` : `redis://${url}`);
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
    purgeCalls: require('./lib/purge-calls').bind(null, client, logger),
    purgeTtsCache: require('./lib/purge-tts-cache').bind(null, client, logger),
    synthAudio: require('./lib/synth-audio').bind(null, client, logger),
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
    pushBack: require('./lib/list/push-back').bind(null, client, logger),
    lengthOfList: require('./lib/list/length').bind(null, client, logger),
    getListPosition: require('./lib/list/position').bind(null, client, logger),
    popFront: require('./lib/list/pop-front').bind(null, client, logger),
    removeFromList: require('./lib/list/remove').bind(null, client, logger),
    getNuanceAccessToken: require('./lib/get-nuance-access-token').bind(null, client, logger),
    getIbmAccessToken: require('./lib/get-ibm-access-token').bind(null, client, logger),
    getTtsVoices: require('./lib/get-tts-voices').bind(null, client, logger),
  };
};
