//     telegram.link
//     Copyright 2014 Enrico Stara 'enrico.stara@gmail.com'
//     Released under the MIT License
//     https://github.com/enricostara/telegram-mt-node


// ***

// Dependencies:
var telegramMt = require('telegram-mt-node');
var auth = telegramMt.auth;
var utility = telegramMt.utility;
var net = telegramMt.net;
// ***

// This module is the entry-point of **Telegram.link** library and provides the highest-level **interface** to communicate
// with the **Telegram** data-center. When you write your _telegram-like-app_ you should deal only with this module.

// Writing your app, you should import the module as follows:

//      var telegramLink = require('telegram.link');

// ***
// **Function:** telegramLink.**createClient(appId, primaryDC, [options], [connectionListener])**

// This function creates the Client and connects to the supplied primary Telegram data center address.

// When the Client connection is established the `connect` event will be emitted.

// Usage example:

//      var client = telegramLink.createClient(
//          appId, primaryDC,
//          { connectionType: 'TCP' },
//          function(ex){
//              if(!ex) { console.log('connected!'); }
//          }
//      );

// - **appId**: is the application ID, you can get it your own at https://core.telegram.org/myapp (Required).
// - **primaryDC**: the primary data center address, you could use `telegramLink.TEST_PRIMARY_DC` or
// `telegramLink.PROD_PRIMARY_DC`(Required)
// - **options**: this argument should be an object which specifies:
//      - **connectionType**: the value could be `HTTP` or `TCP`, HTTP is the default.
//      - **authKey**: an authentication key, already persisted by your app, can be supplied here and the
//      `authKeyCreate` event will be emitted when the connection will be established, after the the `connect` event.
// - **connectionListener**: a callback function, it will be registered as listener on `connect` event.

// The code:
function createClient(appId, primaryDC) {
    var args = arguments;
    var options = {};
    var callback;
    if (typeof args[2] === 'object') {
        options = args[2];
        if (typeof args[3] === 'function') {
            callback = args[3];
        }
    } else if (typeof args[2] === 'function') {
        callback = args[2];
    }
    var client = new Client(appId, primaryDC, options.authKey, options.connectionType);
    if (callback) {
        client.once(exports.EVENT.CONNECT, callback);
    }
    connect.apply(client);
    return client;
}

// ***
// **Class:** telegramLink.**Client**

// This class is a connection client to Telegram. Client instances implement the Telegram API.

// They must be created by the `createClient()` method above and the following constructor cannot be called directly (Private).

// The code :
function Client(appId, primaryDC, authKey, connectionType) {
    this._appId = appId;
    this._authKey = authKey;
    this._sessionId = utility.createNonce(8);
    if ('TCP' === connectionType) {
        this._connection = new net.TcpConnection(primaryDC);
    } else {
        this._connection = new net.HttpConnection(primaryDC);
    }
}
// Extend `events.EventEmitter` class
require('util').inherits(Client, require('events').EventEmitter);

// ***
// client.**createAuthKey([callback])**

// This method exchanges the authorization key with Telegram, see https://core.telegram.org/mtproto/auth_key

// This function is asynchronous. When the authKey is created, the 'authKeyCreate' event will be emitted.

// The last parameter callback will be added as an listener for the 'authKeyExchanged' event, the callback
// could receive the following arguments:
// - **error**: the error if an exception occurs, null otherwise.
// - **authKey**: the authentication key exchanged with Telegram

// The code:
Client.prototype.createAuthKey = function (callback) {
    if(callback) {
        this.once(exports.EVENT.AUTH_KEY_CREATE, callback);
    }
    auth.createAuthKey(
        createEventEmitterCallback(exports.EVENT.AUTH_KEY_CREATE).bind(this),
        this._connection);
};

// ***
// client.**end([callback])**

// This method closes the communication with the DataCenter,

// The last parameter **callback** will be added as a listener for the `end` event

// The code:
Client.prototype.end = function (callback) {
    if(callback) {
        this.once(exports.EVENT.END, callback);
    }
    this._connection.close(createEventEmitterCallback(exports.EVENT.END).bind(this));
};

// ***
// connect()

// This method establishes the connection to the data center (Private)

// The code:
function connect() {
    this._connection.connect(createEventEmitterCallback(exports.EVENT.CONNECT).bind(this));
}

// ***
// createEventEmitterCallback()

// This method provides a callback function that emits the supplied event type or an error event otherwise (Private)

// The code:
function createEventEmitterCallback(event) {
    return function(ex) {
        if (ex) {
            this.emit(exports.EVENT.ERROR, ex);
        } else {
            var args = Array.prototype.slice.call(arguments);
            args[0] = event;
            this.emit.apply(this, args);
        }
    };
}

// ***
// **Event: 'connect'**

// Emitted when the client connection is successfully established. See connect().

// **Event: 'authKeyCreate'**

// Emitted when the  authKey is successfully created. See client.**createAuthKey()**.

// **Event: 'end'**

// Emitted when the data center close the connection. See client.**end()**.

// **Event: 'error'**

// Emitted when an error occurs.

// ***

// Export the event names:
exports.EVENT = {
    ERROR: 'error',
    CONNECT: 'connect',
    AUTH_KEY_CREATE: 'authKeyCreate',
    END: 'end'
};

// Export the internals
exports.createClient = createClient;
var staticInfo = require('./static');
exports.TEST_PRIMARY_DC = staticInfo.telegram.test.primaryDataCenter;
exports.PROD_PRIMARY_DC = staticInfo.telegram.prod.primaryDataCenter;

// ***

// Print the library version
console.log(staticInfo.signature);
console.log('v.%s', require('../package.json').version);

// Register the project name on the logging system
var getLogger = require('get-log');
getLogger.PROJECT_NAME = require('../package.json').name;
