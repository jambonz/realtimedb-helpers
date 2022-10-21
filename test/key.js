const test = require('tape').test ;
const config = require('config');
const opts = config.get('redis');

async function sleepFor(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

test('key tests', async(t) => {
  const fn = require('..');
  const {addKey, addKeyNx, deleteKey, retrieveKey, incrKey, decrKey, client} = fn(opts);

  try {
    let result = await addKey('akey', 'value');
    t.ok(result === 'OK', 'sucessfully set a key with no expires');
    result = await retrieveKey('akey');
    t.ok(result === 'value', 'sucessfully retrieved key');
    result = await addKey('bkey', 'another value', 3);
    t.ok(result === 'OK', 'sucessfully set a key with expires');

    await deleteKey('akey');
    await deleteKey('bkey');
    await deleteKey('mykey');

    result = await addKeyNx('mykey', 'myvalue', 2);
    t.ok(result === 'OK', 'sucessfully setnx a key when it does not exist');
    result = await addKeyNx('mykey', 'myvalue');
    t.ok(result === null, 'setnx returns null if key exists');
    await sleepFor(3000)
    result = await addKeyNx('mykey', 'myvalue');
    t.ok(result === 'OK', 'setnx inserts key again if key has expired');
    await deleteKey('mykey');


    result = await incrKey('mykey');
    t.ok(result === 1, 'incrKey initializes to zero if not there');

    result = await incrKey('mykey');
    t.ok(result === 2, 'incrKey increments key with no expires');

    result = await decrKey('mykey');
    t.ok(result === 1, 'decrKey works properly when key exists');
  
    result = await decrKey('nokey');
    t.ok(result === -1, 'decrKey returns -1 when key did not exist');

    result = await incrKey('mykey-now', 1);
    t.ok(result === 1, 'incrKey increments key with expires');

    t.end();

  }
  catch (err) {
    console.error(err);
    t.end(err);
  }
  client.quit();
});

