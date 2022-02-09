const test = require('tape').test ;
const config = require('config');
const opts = config.get('redis-auth');

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
    t.ok(result === true, 'able to set akey - connecting with auth');

    result = await retrieveHash('akey');
    t.ok(result.foo === 'bar' && result.baz === 'zzz', 'retrieves akey  - connecting with auth');

    await sleep(2);
    result = await retrieveHash('akey');
    t.ok(result === null, 'akey expires after 1 sec  - connecting with auth');

    result = await createHash('akey', {
      foo: 'bar',
      baz: 'zzz'
    }, 1);
    t.ok(result === true, 'able to set akey again  - connecting with auth');

    result = await createHash('akey', {
      foo: 'bar'
    });
    t.ok(result === false, 'fails to set akey when already set  - connecting with auth');

    result = await createHash('bkey', {
      foo: 'bar',
      timeout: 60,
      ok: null
    });
    t.ok(result === true, 'able to set key with number values  - connecting with auth');

    result = await deleteKey('bkey');
    t.ok(result === true, 'key successfully deleted  - connecting with auth');

    result = await deleteKey('ckey');
    t.ok(result === false, 'delete of unknown key failed  - connecting with auth');

    await client.flushallAsync();

    t.end();

  }
  catch (err) {
    console.error(err);
    t.end(err);
  }
  client.quit();
});

