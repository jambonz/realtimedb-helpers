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
  const {listQueues, pushBack, client} = fn(opts);

  //wait 1 sec for connection
  //await sleep(1); 

  try {

    await pushBack('queue:account-sid:queue1', 'url1');
    await pushBack('queue:account-sid:queue1', 'url2');
    await pushBack('queue:account-sid:queue1', 'url3');
    await pushBack('queue:account-sid:queue1', 'url4');
    await pushBack('queue:account-sid:training-queue', 'a value');
    await pushBack('queue:account-sid:training-queue', 'another value');

    let queues = await listQueues('account-sid');
    t.ok(queues.length === 2, 'retrieved 2 total queues');

    queues = await listQueues('account-sid', 'training-*');
    t.ok(queues.length === 1 && queues[0].length === 2, 'retrieved 1 total queues by pattern');

    t.end();
  }
  catch (err) {
    console.error(err);
    t.end(err);
  }
  client.quit();
});
