const test = require('tape').test ;
const config = require('config');
const opts = config.get('redis');

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

test('sorted set queues tests', async(t) => {
  const fn = require('..');
  const {listSortedSetQueues, addToSortedSet, client} = fn(opts);

  try {
    await addToSortedSet('queue:account-with-sorted-set-sid:queue1', 'url1');
    await addToSortedSet('queue:account-with-sorted-set-sid:queue1', 'url2');
    await addToSortedSet('queue:account-with-sorted-set-sid:queue1', 'url3');
    await addToSortedSet('queue:account-with-sorted-set-sid:queue1', 'url4');
    await addToSortedSet('queue:account-with-sorted-set-sid:training-queue', 'url1');
    await addToSortedSet('queue:account-with-sorted-set-sid:training-queue', 'url2');

    let queues = await listSortedSetQueues('account-with-sorted-set-sid');
    t.ok(queues.length === 2, 'retrieves 2 total queues');

    queues = await listSortedSetQueues('account-with-sorted-set-sid', 'training-*');
    t.ok(queues.length === 1 && queues[0].length === 2, 'retrieves 1 total queue by pattern');

    queues = await listSortedSetQueues('account-with-sorted-set-sid', 'dummy-*');
    t.ok(queues.length === 0, 'retrieves empty result for non-existent queue');

    t.end();
  }
  catch (err) {
    console.error(err);
    t.end(err);
  }
  client.quit();
});
