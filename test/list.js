const test = require('tape').test ;
const config = require('config');
const opts = config.get('redis');

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

test('list tests', async(t) => {
  const fn = require('..');
  const {pushBack, lengthOfList, getListPosition, popFront, removeFromList, deleteKey, client} = fn(opts);

  try {
    let result = await pushBack('list', 'http://foo.bar');
    t.ok(result === 1, 'successfully pushed first item on list');
    result = await pushBack('list', 'http://foo.baz');
    t.ok(result === 2, 'successfully pushed second item on list');
    
    result = await lengthOfList('list');
    t.ok(2 === result, 'successfully queried length of list');

    const pos = await getListPosition('list', 'http://foo.baz');
    t.ok(1 === pos, 'successfully found position of item in list');

    result = await popFront('list');
    t.ok(result === 'http://foo.bar', 'successfully popped item from front of list');

    result = await lengthOfList('list');
    t.ok(1 === result, 'length of list is now 1');

    await pushBack('list', 'http://foo.bar');
    result = await removeFromList('list', 'http://foo.bar');
    t.ok(1 === result, 'removed one element');

    await deleteKey('list');

    t.end();

  }
  catch (err) {
    console.error(err);
    t.end(err);
  }
  client.quit();
});

