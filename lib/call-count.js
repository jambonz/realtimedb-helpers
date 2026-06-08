const {noopLogger} = require('./utils');
const debug = require('debug')('jambonz:realtimedb-helpers');

async function getCallCount(client, logger, accountSid) {
  logger = logger || noopLogger;
  try {
    const outboundResult = await client.get(`outcalls:account:${accountSid}`);
    debug({outboundResult}, `outbound callCount: ${accountSid}`);
    const inboundResult = await client.get(`incalls:account:${accountSid}`);
    debug({inboundResult}, `inbound callCount: ${accountSid}`);
    const result = {
      inbound: inboundResult ? inboundResult : 0,
      outbound : outboundResult ? outboundResult : 0
    };
    return result;
  } catch (err) {
    logger.error(err, `callCount: Error account_sid ${accountSid} `);
  }
}

module.exports = getCallCount;
