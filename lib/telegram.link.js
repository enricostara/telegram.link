//     telegram.link
//     Copyright 2014 Enrico Stara 'enrico.stara@gmail.com'
//     Released under the MIT License
//     http://telegram.link


// ***

// Dependencies:
var mt = require('telegram-mt-node');
var auth = mt.auth;
var utility = mt.utility;
var net = mt.net;
var api = require('./api');
var SequenceNumber = mt.SequenceNumber;
var logger = require('get-log')('telegram-link');

// Constants
var NULL_SERVER_SALT = '0x0000000000000000';

// ***

// Print the library version
require('colors');
var printed = false;
module.exports = exports = function (signature) {
    if(!printed) {
        console.log('\n' + (signature || require('./static').signature.cyan));
        var caption = signature ?
            'powered by telegram.link' :
            ('v.' + require('../package.json').version);
        console.log(caption.gray + '\n');
        printed = true;
    }
    return module.exports;
};

// ***

// This module is the entry-point of the **Telegram.link** library and provides the highest-level **interface**
// to communicate with the **Telegram** data-center. When you write your _telegram-like-app_ you
// should deal only with this module.

// You can import the module as follows:

//      var telegramLink = require('telegram.link')();

// ***
// **Function:** telegramLink.**createClient(appId, primaryDC, [options], [connectionListener])**

// Creates the Client and connects to the supplied primary Telegram data center address.

// When the Client connection is established the `connect` event will be emitted.

// Usage example:

//      var client = telegramLink.createClient(
//          {
//              id: 12345,
//              hash: 'q1w2e3r4t5y6u7i8o9p0',
//              version: 'x.y.z',
//              lang: 'xx'
//              [, authKey]
//              [, connectionType: 'TCP']
//          },
//          primaryDC
//          [, function(ex){
//                  if(!ex) { console.log('Connected to Telegram!'); }
//              }]
//      );

// - **app**: are all the application info:
//      - **id** and **hash** _(required)_: you can get it your own APP ID at https://core.telegram.org/myapp
//      - **version** _(required)_: semver of your application, see http://semver.org
//      - **langCode** _(required)_: device/user language, see ISO 639-1
//      - **deviceModel** _(required)_: the device model or the user agent
//      - **systemVersion** _(required)_: the operative system version
//      - **authKey** _(optional)_: the authentication key, already persisted by your app, can be supplied here. The `authKeyCreate`
//       event will be emitted when the connection will be established, after the the `connect` event
//      - **connectionType** _(optional)_: the value could be `HTTP` or `TCP`, HTTP is by default
// - **primaryDC** _(required)_: the primary data center address, you could use `telegramLink.TEST_PRIMARY_DC` or
// `telegramLink.PROD_PRIMARY_DC`
// - **connectionListener** _(optional)_: a callback function, it will be registered as listener on `connect` event

// The code:
function createClient(app, primaryDC, callback) {
    var client = new Client(app, primaryDC);
    if (callback) {
        client.once(exports.EVENT.CONNECT, callback);
    }
    connect.apply(client);
    return client;
}


// ***
// **Class:** telegramLink.**Client**

// Represents the connection client to Telegram and implements the Telegram API.

// It must be created by the `createClient()` method above and the following constructor
// cannot be called directly _(private)_.

// The code :
function Client(app, primaryDC) {
    this._app = app;

    if ('TCP' === app.connectionType) {
        this._connection = new net.TcpConnection(primaryDC);
    } else {
        this._connection = new net.HttpConnection(primaryDC);
    }

    if (app.authKey) {
        this._channel = createEncryptedChannel(this._connection, app, app.authKey, NULL_SERVER_SALT);
    }
}
// Extend the `events.EventEmitter` class
require('util').inherits(Client, require('events').EventEmitter);


// ***
// **Event: 'connect'**

// Emitted when the client connection is successfully established. See connect().

// **Event: 'authKeyCreate'**

// Emitted when the  authKey is successfully created. See client.**createAuthKey()**.

// **Event: 'sendCode'**

// Emitted when the registration code is successfully sent. See client.**sendCode()**.

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
    SEND_CODE: 'sendCode',
    END: 'end'
};


// ***
// _createEncryptedChannel()_

// Creates the encrypted channel used to call all the Telegram API methods _(private)_

// The code:
function createEncryptedChannel(connection, app, authKey, serverSalt) {
    return new net.EncryptedRpcChannel(
        connection, {
            authKey: authKey,
            serverSalt: serverSalt,
            sessionId: utility.createNonce(8),
            sequenceNumber: new SequenceNumber()
        }, app
    );
}

// ***
// client.**createAuthKey([callback])**

// Exchanges the authorization key with Telegram, see https://core.telegram.org/mtproto/auth_key

// This method is asynchronous and the client must be already connected before calling this function.
// When the authKey is created, the `authKeyCreate` event will be emitted.

// The last parameter callback will be added as a listener for the `authKeyCreate` event, the callback
// could receive the following arguments:
// - **error**: the error if an exception occurs, null otherwise.
// - **authKey**: the authentication key exchanged with Telegram

// The code:
Client.prototype.createAuthKey = function (callback) {
    if (callback) {
        this.once(exports.EVENT.AUTH_KEY_CREATE, function (auth) {
            this._channel = createEncryptedChannel(this._connection, this._app, auth.key, auth.serverSalt);
            callback(auth);
        });
    }
    if (this._connection && this._connection.isConnected()) {
        auth.createAuthKey(
            createEventEmitterCallback(exports.EVENT.AUTH_KEY_CREATE).bind(this),
            new net.RpcChannel(this._connection));
    } else {
        var msg = 'Client is not yet connected! Wait until it\'s connected before call this method!';
        logger.error(msg);
        this.emit(exports.EVENT.ERROR, new Error(msg));
    }
};


// ***
// client.**sendCodeToPhone(phoneNumber, [callback])**

// Sends a text message with the confirmation code required for registration to the given phone number

// The code:
Client.prototype.sendCodeToPhone = function (phoneNumber, callback) {
    if (callback) {
        this.once(exports.EVENT.SEND_CODE, function (result) {
            console.log('send-code ', result);
            callback(result);
        });
    }
    var props = {
        phone_number: phoneNumber,
        sms_type: 5,
        api_id: this._app.id,
        api_hash: this._app.hash,
        lang_code: 'en'
    };
    if (this.isReady()) {
        var self = this;
        try {
            api.service.auth.sendCode({
                props: props,
                channel: this._channel,
                callback: function (ex, resObj) {
                    if (ex) {
                        self.emit(exports.EVENT.ERROR, ex);
                    } else {
                        console.log('resObj ', resObj.toPrintable());
                        callback(resObj);
                    }
                }
            });
        } catch (err) {
            this.emit(exports.EVENT.ERROR, err);
        }
    } else {
        var msg = 'Client is not yet ready!';
        logger.error(msg);
        this.emit(exports.EVENT.ERROR, new Error(msg));
    }
};


// ***
// client.**isReady()**

// Checks if the client is ready to communicate with Telegram

// The code:
Client.prototype.isReady = function () {
    return this._channel ? true : false;
};


// ***
// client.**end([callback])**

// Closes the communication with the DataCenter,

// The last parameter **callback** will be added as a listener for the `end` event

// The code:
Client.prototype.end = function (callback) {
    if (callback) {
        this.once(exports.EVENT.END, callback);
    }
    this._connection.close(createEventEmitterCallback(exports.EVENT.END).bind(this));
};

// ***
// _connect()_

// Establishes the connection with the data center _(private)_

// The code:
function connect() {
    this._connection.connect(createEventEmitterCallback(exports.EVENT.CONNECT).bind(this));
}

// ***
// _createEventEmitterCallback()_

// Provides a callback function that emits the supplied event type or an error event _(private)_

// The code:
function createEventEmitterCallback(event) {
    return function (ex) {
        if (ex) {
            this.emit(exports.EVENT.ERROR, ex);
        } else {
            var args = Array.prototype.slice.call(arguments);
            args[0] = event;
            this.emit.apply(this, args);
        }
    };
}


// Export the internals
exports.createClient = createClient;
var staticInfo = require('./static');
exports.TEST_PRIMARY_DC = staticInfo.telegram.test.primaryDataCenter;
exports.PROD_PRIMARY_DC = staticInfo.telegram.prod.primaryDataCenter;