const test = require('tape').test ;
const config = require('config');
const opts = config.get('redis');

function sleep(secs) {
  return new Promise((resolve) => {
    setTimeout(resolve, secs * 1000);
  });
}

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

test('queues tests', async(t) => {
  const fn = require('..');
  const {listQueues, addKey, client} = fn(opts);

  //wait 1 sec for connection
  //await sleep(1); 

  try {

    await addKey('queue:account-sid:queue1', 'another value');
    await addKey('queue:account-sid:queue2', 'another value');
    await addKey('queue:account-sid:queue3', 'another value');
    await addKey('queue:account-sid:queue4', 'another value');
    await addKey('queue:account-sid:queue5', 'another value');
    await addKey('queue:account-sid:training-queue', 'another value');

    let queues = await listQueues('account-sid');
    //console.log(queues);
    t.ok(queues.length === 6, 'retrieved 6 total queues');

    queues = await listQueues('account-sid', 'training-*');
    //console.log(queues);
    t.ok(queues.length === 1, 'retrieved 1 total queues by pattern');

    t.end();

  }
  catch (err) {
    console.error(err);
    t.end(err);
  }
  client.quit();
});
