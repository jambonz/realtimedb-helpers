const test = require('tape').test ;
const config = require('config');
const opts = config.get('redis');

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

function sleep(secs) {
  return new Promise((resolve) => {
    setTimeout(resolve, secs * 1000);
  });
}

test('hash tests', async(t) => {
  const fn = require('..');
  const {createHash, retrieveHash, deleteKey, client} = fn(opts);

  try {
    let result = await createHash('akey', {
      foo: 'bar',
      baz: 'zzz'
    }, 1);
    t.ok(result === true, 'able to set akey');

    result = await retrieveHash('akey');
    t.ok(result.foo === 'bar' && result.baz === 'zzz', 'retrieves akey');

    await sleep(2);
    result = await retrieveHash('akey');
    t.ok(result === null, 'akey expires after 1 sec');

    result = await createHash('akey', {
      foo: 'bar',
      baz: 'zzz'
    }, 1);
    t.ok(result === true, 'able to set akey again');

    result = await createHash('akey', {
      foo: 'bar'
    });
    t.ok(result === false, 'fails to set akey when already set');

    result = await createHash('bkey', {
      foo: 'bar',
      timeout: 60,
      ok: null
    });
    t.ok(result === true, 'able to set key with number values');

    result = await deleteKey('bkey');
    t.ok(result === true, 'key successfully deleted');

    result = await deleteKey('ckey');
    t.ok(result === false, 'delete of unknown key failed');

    await client.flushallAsync();

    t.end();

  }
  catch (err) {
    console.error(err);
    t.end(err);
  }
  client.quit();
});

