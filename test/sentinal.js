const test = require('tape');
const { nodeMachine, output } = require('./node-machine')('test_redis_net');

test('Start testing sentinel by docker client...', async(t) => {
  try {
    await nodeMachine('172.40.0.50');
    t.pass('docker sentinel passed');
    t.end();
  } catch(err) {
    console.log(output());
    t.end(err);
  }
  

});