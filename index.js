const {noopLogger} = require('./lib/utils');
const bluebird = require('bluebird');
const redis = require('redis');
const StatsCollector = require('jambonz-stats-collector');
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

module.exports = function(opts, logger) {
  logger = logger || noopLogger;
  const client = redis.createClient(opts);
  ['ready', 'connect', 'reconnecting', 'error', 'end', 'warning']
    .forEach((event) => {
      client.on(event, (...args) => {
        logger.debug({args}, `redis event ${event}`);
      });
    });

  const stats = new StatsCollector(logger);

  return {
    client,
    updateCallStatus: require('./lib/update-call-status').bind(null, client, logger),
    retrieveCall: require('./lib/retrieve-call').bind(null, client, logger),
    deleteCall: require('./lib/delete-call').bind(null, client, logger),
    listCalls: require('./lib/list-calls').bind(null, client, logger),
    purgeCalls: require('./lib/purge-calls').bind(null, client, logger),
    synthAudio: require('./lib/synth-audio').bind(null, client, logger, stats),
    createSet: require('./lib/set/create-set').bind(null, client, logger),
    addToSet: require('./lib/set/add-to-set').bind(null, client, logger),
    removeFromSet: require('./lib/set/remove-from-set').bind(null, client, logger),
    retrieveSet: require('./lib/retrieve-set').bind(null, client, logger),
    createHash: require('./lib/hash/create-hash').bind(null, client, logger),
    retrieveHash: require('./lib/hash/retrieve-hash').bind(null, client, logger),
    addKey: require('./lib/key/add-key').bind(null, client, logger),
    retrieveKey: require('./lib/key/retrieve-key').bind(null, client, logger),
    deleteKey: require('./lib/key/delete-key').bind(null, client, logger),
    pushBack: require('./lib/list/push-back').bind(null, client, logger),
    lengthOfList: require('./lib/list/length').bind(null, client, logger),
    getListPosition: require('./lib/list/position').bind(null, client, logger),
    popFront: require('./lib/list/pop-front').bind(null, client, logger),
    removeFromList: require('./lib/list/remove').bind(null, client, logger),
  };
};
