# jambonz-realtimedb-helpers ![CI](https://github.com/jambonz/realtimedb-helpers/workflows/CI/badge.svg)


A set of helper functions to access data in the jambonz in-memory database (currently implemented using redis).

This module exposes a function that should be called with redis [configuration options](https://github.com/NodeRedis/node_redis#rediscreateclient) and, optionally, a [pino](https://www.npmjs.com/package/pino) logger function.  It then returns an object containing various useful functions for accessing and updating the database.

```
const opts = {
  "host": "localhost",
  "port": 3279
};
const logger = require('pino')();
const {updateCallStatus} = require('jambonz-realtimedb-helpers')(opts, logger);
```

### Functions

- [updateCallStatus](#updateCallStatus) - adds or updates the call status for a given call identified by call Sid.
- [retrieveCallInfo](#retrieveCallInfo) - retrieves the call data for a call.
- [listCallInfo](#listCallInfo) - retrieves all the calls for a given account
- [deleteCall](#deleteCall) - removes call data for a call.
- [purgeCalls](#purgeCalls) - removes call data for all calls that completed some time ago.
- [synthAudio](#synthAudio) - retrieves generated tts audio from cache, or generates it

#### updateCallStatus
`updateCallStatus(callInfo, serviceUrl)`
<p style="margin: -5px 0px 10px 25px;font-size: smaller">returns a Promise yielding a boolean indicating success or failure of the operation.</p>

Adds or updates the information about a call.  The callInfo object must contain (at least) the following properties:

| property        | description |
| ------------- |-------------|
| callSid | the Call Sid for this call|
| callId | the SIP Call-ID |
| sipStatus | the most recent sip status - a value of 100 means this is a new call that should be added|
| callStatus | one of 'trying', 'ringing', 'early-media', 'in-progress', 'completed', 'failed', 'busy', 'no-answer', or 'queued'|

Additionally, the `serviceUrl` parameter is required if the sipStatus is 100 (i.e. a new call).  It must contain the service endpoint of the specific feature-server instance that is controlling this call.

When a call reaches a final state ('completed', 'failed', 'busy', or 'no-answer') the associated call data will be purged one hours later.  This database is intended only to be used for live call information.

#### retrieveCallInfo
`retrieveCallInfo(accountSid, callSid)`
<p style="margin: -5px 0px 10px 25px;font-size: smaller">returns a Promise yielding the call information as an object.</p>

Retrieves the call information associated with a given call sid, if available.

```
const callInfo = await retrieveCallInfo(accountSid, callSid);
if (!callInfo) {
  logger.info(`call for ${callSid} not found);
}
```

#### listCallInfo
`listCallInfo(accountSid)`
<p style="margin: -5px 0px 10px 25px;font-size: smaller">returns a Promise yielding an array of information about calls.</p>

Retrieves all of the active (or recently-active) calls for an Account.

```
const calls = await listCallInfo(accountSid);
```

#### deleteCall
`deleteCall(accountSid, callSid)`
<p style="margin: -5px 0px 10px 25px;font-size: smaller">returns boolean indicating if call was successfully deleted</p>

Deletes a Call.

```
const result = await deleteCall(accountSid, callSid);
```

#### purgeCalls
`purgeCalls()`
<p style="margin: -5px 0px 10px 25px;font-size: smaller">returns number of calls purged</p>

Purges call data for calls that ended some time ago.

```
const countDeleted = await purgeCalls();
```

#### synthAudio
`synthAudio({vendor, language, voice, text})`
<p style="margin: -5px 0px 10px 25px;font-size: smaller">returns the path to a temporary file containing the generated audio</p>

Generates audio for text, retrieving previously generated audio from cache if available.  Audio is cached for 24 hours.

```
const path = await synthAudio({
  vendor: 'aws', 
  language: 'en-US', 
  voice: 'Amy', 
  text: 'This is a test'
});
```
