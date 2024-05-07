const test = require('tape').test ;
const config = require('config');
const opts = config.get('redis');


process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

test('Conference tests', async(t) => {
  const fn = require('..');
  const {listConferences, createHash, client} = fn(opts);

  //wait 1 sec for connection
  //await sleep(1); 

  try {

    await createHash('conf:account-sid:conf1', 'url1');
    await createHash('conf:account-sid:conf2', 'url2');
    await createHash('conf:account-sid:conf3', 'url3');
    await createHash('conf:account-sid:conf4', 'url4');
    await createHash('conf:account-sid:ss-conf5', 'a value');
    await createHash('conf:account-sid:ss-conf6', 'another value');

    let confs = await listConferences('account-sid');
    t.ok(confs.length === 6, 'retrieved 6 total queues');

    confs = await listConferences('account-sid', 'ss-*');
    t.ok(confs.length === 2, 'retrieved 2 total queues by pattern');

    t.end();
  }
  catch (err) {
    console.error(err);
    t.end(err);
  }
  client.quit();
});
