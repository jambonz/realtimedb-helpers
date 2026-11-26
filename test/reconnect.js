const test = require('tape').test ;
const config = require('config');
const opts = config.get('redis');

test('reconnect on READONLY after a failover', async(t) => {
  const fn = require('..');
  const readonly = new Error('READONLY You can\'t write against a read only replica.');

  let {client} = fn(opts);
  t.equal(client.options.reconnectOnError(readonly), 2, 'reconnects and resends on READONLY');
  t.equal(client.options.reconnectOnError(new Error('ERR wrong number of arguments')), false,
    'does not reconnect on other errors');
  client.disconnect();

  ({client} = fn({...opts, reconnectOnError: () => 1}));
  t.equal(client.options.reconnectOnError(readonly), 1, 'a caller-supplied reconnectOnError wins');
  client.disconnect();
  t.end();
});
