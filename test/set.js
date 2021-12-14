const test = require('tape').test ;
const config = require('config');
const opts = config.get('redis');

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

test('set tests', async(t) => {
  const fn = require('..');
  const {createSet, retrieveSet, addToSet, removeFromSet, isMemberOfSet, client} = fn(opts);

  try {
    const set1 = new Set();
    set1.add('10.10.10.1');
    set1.add('10.10.10.2');
    
    let added = await createSet('sbcList-1', set1);
    t.ok(2 === added, 'creates new set');

    const set2 = new Set();
    set2.add('10.10.10.4');

    added = await createSet('sbcList-1', set2);
    t.ok(1 === added, 'recreates set with new members');

    let ret = await retrieveSet('sbcList-1');
    t.ok(Array.isArray(ret) && ret.length === 1 && ret[0] === '10.10.10.4', 'retrieves set members');

    let count = await addToSet('sbcList-1', '10.10.10.5');
    t.ok(count === 1, 'addToSet adds a string as member');

    count = await addToSet('sbcList-1', ['10.10.10.6', '10.10.10.7']);
    t.ok(count === 2, 'addToSet adds an array as member');

    let exists = await isMemberOfSet('sbcList-1', '10.10.10.6');
    t.ok(exists, 'isMemberOfSet returns true when key exists in set');
    
    exists = await isMemberOfSet('sbcList-1', '10.10.10.99');
    t.ok(!exists, 'isMemberOfSet returns false when key does not exist in set');
    
    const set3 = new Set();
    set3.add('10.10.10.8');
    set3.add('10.10.10.9');
    set3.add('10.10.10.10');
    count = await addToSet('sbcList-1', set3);
    t.ok(count === 3, 'addToSet adds a set as member');

    count = await removeFromSet('sbcList-1', '10.10.10.5');
    t.ok(count === 1, 'removeFromSet single member');

    count = await removeFromSet('sbcList-1', ['10.10.10.6', '10.10.10.7']);
    t.ok(count === 2, 'removeFromSet array of members');

    count = await removeFromSet('sbcList-1', set3);
    t.ok(count === 3, 'removeFromSet set of members');

    ret = await retrieveSet('sbcList-1');
    t.end();

  }
  catch (err) {
    console.error(err);
    t.end(err);
  }
  client.quit();
});

