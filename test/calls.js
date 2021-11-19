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

test('calls tests', async(t) => {
  const fn = require('..');
  const {updateCallStatus, retrieveCall, deleteCall, listCalls, purgeCalls, client} = fn(opts);

  //wait 1 sec for connection
  //await sleep(1); 

  try {
    let status = await updateCallStatus({
      callId: 'xxxx',
      sipStatus: 100,
      callStatus: 'Trying'
    }, 'http://127.0.0.1:3000');
    t.ok(!status, 'fails to add new call when callSid is missing');

    status = await updateCallStatus({
      callSid: 'callSid-1',
      callId: 'xxxx',
      sipStatus: 100,
      callStatus: 'Trying'
    }, 'http://127.0.0.1:3000');
    t.ok(!status, 'fails to add new call when accountSid is missing');

    status = await updateCallStatus({
      callSid: 'callSid-1',
      sipStatus: 100,
      callStatus: 'Trying'
    }, 'http://127.0.0.1:3000');
    t.ok(!status, 'fails to add new call when callId is missing');

    status = await updateCallStatus({
      callSid: 'callSid-1',
      callId: 'xxxx',
      callStatus: 'Trying'
    }, 'http://127.0.0.1:3000');
    t.ok(!status, 'fails to add new call when sipStatus is missing');

    status = await updateCallStatus({
      callSid: 'callSid-1',
      callId: 'xxxx',
      sipStatus: 100
    }, 'http://127.0.0.1:3000');
    t.ok(!status, 'fails to add new call when callStatus is missing');

    status = await updateCallStatus({
      callSid: 'callSid-1',
      callId: 'xxxx',
      sipStatus: 100,
      callStatus: 'foobar'
    }, 'http://127.0.0.1:3000');
    t.ok(!status, 'fails to add new call when callStatus is invalid');

    status = await updateCallStatus({
      callSid: 'callSid-1',
      callId: 'xxxx',
      sipStatus: 100,
      callStatus: 'trying'
    });
    t.ok(!status, 'fails to add new call when serviceUrl is not provided');

    status = await updateCallStatus({
      callSid: 'callSid-1',
      accountSid: 'account-1',
      callId: 'xxxx',
      sipStatus: 100,
      callStatus: 'trying'
    }, 'http://127.0.0.1:3000');
    t.ok(status, 'successfully adds new call when status is 100 Trying');

    status = await updateCallStatus({
      callSid: 'callSid-2',
      accountSid: 'account-1',
      applicationSid: null,
      callId: 'xxxx',
      sipStatus: 100,
      callStatus: 'trying'
    }, 'http://127.0.0.1:3000');
    t.ok(status, 'successfully adds second new call');

    status = await updateCallStatus({
      callSid: 'callSid-3',
      accountSid: 'account-1',
      applicationSid: null,
      callId: 'xxxx',
      sipStatus: 100,
      callStatus: 'trying'
    }, 'http://127.0.0.1:3000');
    t.ok(status, 'successfully adds third new call');

    let callInfo = await retrieveCall('account-1', 'callSid-1');
    t.ok(callInfo.callId === 'xxxx', 'successfully retrieves call');

    callInfo = await retrieveCall('account-1', 'callSid-2');
    t.ok(callInfo.callId === 'xxxx', 'successfully retrieves second call');

    callInfo = await retrieveCall('account-1', 'callSid-X');
    t.ok(!callInfo, 'fails to retrieve unknown call');

    let calls = await listCalls('account-1');
    t.ok(calls.length === 3, 'successfully listed all calls');

    let result = await deleteCall('account-1', 'callSid-2');
    t.ok(result === true, 'successfully deleted callSid-2');
  
    result = await deleteCall('account-1', 'callSid-2');
    t.ok(result === false, 'failed to delete non-existent call sid');

    let count = await purgeCalls();
    t.ok(count === 0, 'no calls purged');

    // force age out by removing key
    count = await client.delAsync(`call:account-1:callSid-3`);
    t.ok(count === 1, 'forced call 3 to age out');

    count = await purgeCalls();
    t.ok(count === 1, '1 call purged');


    await client.flushallAsync();

    for( let i = 0; i < 1000; i++) {
      await updateCallStatus({
        callSid: `callSid-${i}`,
        accountSid: 'account-1',
        callId: 'xxxx',
        sipStatus: 100,
        callStatus: 'trying'
      }, 'http://127.0.0.1:3000');
    }
    t.pass('successfully added 1,000 calls');

    count = await purgeCalls();
    t.ok(count === 0, 'no calls purged');

    calls = await listCalls('account-1');
    t.ok(calls.length === 1000, 'successfully retrieved all 1,000 calls');

    await client.flushallAsync();

    t.end();

  }
  catch (err) {
    console.error(err);
    t.end(err);
  }
  client.quit();
});

