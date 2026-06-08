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

test('ephemeral gateway tests', async(t) => {
  const fn = require('..');
  const {createEphemeralGateway, queryEphemeralGateways, retrieveHash, deleteKey, deleteEphemeralGateway, client} = fn(opts);

  try {
    const ipAddress = 'beachdog.sip.jambonz.cloud';
    const voipCarrierSid = 'test-carrier-sid-123';
    const ttlSeconds = 2;

    // Test query on non-existent IP
    let carriers = await queryEphemeralGateways('nonexistent.ip.address');
    t.ok(Array.isArray(carriers) && carriers.length === 0, 'returns empty array for non-existent IP');

    // Create ephemeral gateway entry
    let result = await createEphemeralGateway(ipAddress, voipCarrierSid, ttlSeconds);
    t.ok(result === true, 'successfully created ephemeral gateway');

    // Query active carriers for this IP
    carriers = await queryEphemeralGateways(ipAddress);
    t.ok(carriers.length === 1 && carriers[0] === voipCarrierSid, 'query returns active carrier');

    // Retrieve and verify the hash
    const key = `eph-gw-ip:${ipAddress}`;
    let hash = await retrieveHash(key);
    t.ok(hash !== null, 'ephemeral gateway key exists');

    const expiryTimestamp = parseInt(hash[voipCarrierSid]);
    const now = Math.floor(Date.now() / 1000);
    t.ok(expiryTimestamp > now && expiryTimestamp <= now + ttlSeconds, 'expiry timestamp is correct');

    // Test updating existing gateway with same IP
    const updatedTtlSeconds = 3;
    result = await createEphemeralGateway(ipAddress, voipCarrierSid, updatedTtlSeconds);
    t.ok(result === true, 'successfully updated ephemeral gateway');

    hash = await retrieveHash(key);
    const updatedExpiryTimestamp = parseInt(hash[voipCarrierSid]);
    t.ok(updatedExpiryTimestamp > expiryTimestamp, 'expiry timestamp was updated');

    // Test multiple carriers on same IP
    const voipCarrierSid2 = 'test-carrier-sid-456';
    result = await createEphemeralGateway(ipAddress, voipCarrierSid2, ttlSeconds);
    t.ok(result === true, 'successfully added second carrier to same IP');

    hash = await retrieveHash(key);
    t.ok(hash[voipCarrierSid] && hash[voipCarrierSid2], 'both carriers exist in hash');

    // Query should return both carriers
    carriers = await queryEphemeralGateways(ipAddress);
    t.ok(carriers.length === 2 && carriers.includes(voipCarrierSid) && carriers.includes(voipCarrierSid2),
      'query returns both active carriers');

    // Wait for key expiry (conservative 7200 seconds expiry should not trigger in test)
    // But verify key still exists
    await sleep(1);
    hash = await retrieveHash(key);
    t.ok(hash !== null, 'key still exists after 1 second');

    // Test expired entry filtering and removal
    const expiredCarrierSid = 'expired-carrier-sid';
    const expiredTimestamp = Math.floor(Date.now() / 1000) - 10; // Already expired
    await client.hset(key, expiredCarrierSid, expiredTimestamp);

    // Verify expired entry was added
    hash = await retrieveHash(key);
    t.ok(hash[expiredCarrierSid], 'expired entry was added to hash');

    // Query should filter out expired carrier
    carriers = await queryEphemeralGateways(ipAddress);
    t.ok(!carriers.includes(expiredCarrierSid), 'query filters out expired carriers');

    // Verify expired entry was removed from Redis
    hash = await retrieveHash(key);
    t.ok(!hash[expiredCarrierSid], 'expired entry was removed from Redis');
    t.ok(hash[voipCarrierSid] && hash[voipCarrierSid2], 'active entries remain in Redis');

    // Test delete ephemeral gateway - single carrier
    let deleteResult = await deleteEphemeralGateway(ipAddress, voipCarrierSid);
    t.ok(deleteResult === true, 'successfully deleted single carrier');

    hash = await retrieveHash(key);
    t.ok(!hash[voipCarrierSid], 'deleted carrier no longer exists in hash');
    t.ok(hash[voipCarrierSid2], 'other carrier still exists in hash');

    carriers = await queryEphemeralGateways(ipAddress);
    t.ok(carriers.length === 1 && carriers[0] === voipCarrierSid2, 'query returns only remaining carrier');

    // Test delete non-existent carrier
    deleteResult = await deleteEphemeralGateway(ipAddress, 'non-existent-carrier');
    t.ok(deleteResult === false, 'deleting non-existent carrier returns false');

    // Test delete last remaining carrier (should clean up key)
    deleteResult = await deleteEphemeralGateway(ipAddress, voipCarrierSid2);
    t.ok(deleteResult === true, 'successfully deleted last carrier');

    hash = await retrieveHash(key);
    t.ok(hash === null, 'key was cleaned up after deleting last carrier');

    carriers = await queryEphemeralGateways(ipAddress);
    t.ok(Array.isArray(carriers) && carriers.length === 0, 'query returns empty array after all carriers deleted');

    // Clean up
    await deleteKey(key);

    await client.flushall();

    t.end();

  }
  catch (err) {
    console.error(err);
    t.end(err);
  }
  client.quit();
});
