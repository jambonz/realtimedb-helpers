const test = require('tape').test ;
const config = require('config');
const opts = config.get('redis');

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});


test('sorted set', async (t) => {
  const fn = require('..');
  const {addToSortedSet, retrieveFromSortedSet, sortedSetLength, retrieveByPatternSortedSet, sortedSetPositionByPattern, client} = fn(opts);
  try {
    const setName = 'tasks';
    let result = await addToSortedSet(setName, 'url1', 99);
    t.ok(result === 1, 'successfully added item to sorted set');
    result = await addToSortedSet(setName, 'url2', 0);
    t.ok(result === 1, 'successfully added item to sorted set');
    result = await addToSortedSet(setName, 'url3', 0);
    t.ok(result === 1, 'successfully added item to sorted set');
    result = await addToSortedSet(setName, 'url4');
    t.ok(result === 1, 'successfully added item to sorted set');
    result = await addToSortedSet(setName, 'url5');
    t.ok(result === 1, 'successfully added item to sorted set');
    result = await addToSortedSet(setName, 'url55');
    t.ok(result === 1, 'successfully added item to sorted set');

    result = await sortedSetLength(setName);
    t.ok(result === 6, 'successfully get sorted set length');

    result = await sortedSetPositionByPattern(setName, '*url3');
    t.ok(result[0] === 1, 'successfully positioning element')
    result = await sortedSetPositionByPattern(setName, '*url1');
    t.ok(result[0] === 2, 'successfully positioning element')

    result = await retrieveByPatternSortedSet(setName, '*url5*');
    t.ok(result[0] === 'url5', 'successfully get sorted set by pattern');
    t.ok(result[1] === 'url55', 'successfully get sorted set by pattern');
    // All url5 already poped
    result = await retrieveByPatternSortedSet(setName, '*url5*');
    t.ok(result.length === 0, 'successfully get sorted set by pattern');

    result = await retrieveFromSortedSet(setName);
    t.ok(result === 'url2', 'successfully get priotized item');
    result = await retrieveFromSortedSet(setName);
    t.ok(result === 'url3', 'successfully get priotized item');
    result = await retrieveFromSortedSet(setName);
    t.ok(result === 'url1', 'successfully get priotized item');
    result = await retrieveFromSortedSet(setName);
    t.ok(result === 'url4', 'successfully get priotized item');
    result = await retrieveFromSortedSet(setName);
    t.ok(result === undefined, 'successfully get priotized item');
  }
  catch (err) {
    console.error(err);
    t.end(err);
  }
  client.quit();
});