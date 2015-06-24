//     telegram.link
//     Copyright 2014 Enrico Stara 'enrico.stara@gmail.com'
//     Released under the MIT License
//     http://telegram.link


// ***

// Dependencies:
var tl = require('telegram-tl-node');
var mt = require('telegram-mt-node');
var api = require('./api');
var Auth = require('./auth');
var utility = require('./utility');
var SequenceNumber = mt.SequenceNumber;
var logger = require('get-log')('telegram-link');

// Constants
var NULL_SERVER_SALT = '0x0000000000000000';

// ***

// Print the library version
require('colors');
var printed = false;
module.exports = exports = function (signature) {
    if (!printed) {
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
// - **dataCenter** _(required)_: the data center address, you could use `telegramLink.TEST_PRIMARY_DC` or
// `telegramLink.PROD_PRIMARY_DC`
// - **connectionListener** _(optional)_: a callback function, it will be registered as listener on `connect` event

// The code:
function createClient(app, dataCenter, callback) {
    var client = new Client(app, dataCenter);
    if (callback) {
        client.once('connect', callback);
    }
    connect.apply(client);
    return client;
}


// ***
// **Function:** telegramLink.**retrieveAuthKey(authKeyBuffer, authKeyPassword)**

// Decrypts the `authKeyBuffer` using the `authKeyPassword`, returns the authKey instance or null if the password is wrong

// The code:
function retrieveAuthKey(authKeyBuffer, authKeyPassword) {
    return mt.auth.AuthKey.decryptAuthKey(authKeyBuffer, authKeyPassword);
}


// ***
// **Class:** telegramLink.**Client**

// Represents the connection client to Telegram and implements the Telegram API.

// It must be created by the `createClient()` method above and the following constructor
// cannot be called directly _(private)_.

// The code :
function Client(app, dataCenter) {
    this._app = app;

    if ('TCP' === app.connectionType) {
        this._connection = new mt.net.TcpConnection(dataCenter);
    } else {
        this._connection = new mt.net.HttpConnection(dataCenter);
    }

    if (app.authKey) {
        this._channel = createEncryptedChannel(this._connection, app, app.authKey, NULL_SERVER_SALT);
    }

    // creates the authorization module bound with the client to call all the API methods
    // required to the user authorization
    this.auth = new Auth(this);
}
// Extend the `events.EventEmitter` class
require('util').inherits(Client, require('events').EventEmitter);


// ***
// _createEncryptedChannel()_

// Creates the encrypted channel used to call all the Telegram API methods _(private)_

// The code:
function createEncryptedChannel(connection, app, authKey, serverSalt) {
    return new mt.net.EncryptedRpcChannel(
        connection, {
            authKey: authKey,
            serverSalt: serverSalt,
            sessionId: mt.utility.createNonce(8),
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
        this.once('authKeyCreate', function (auth) {
            this._channel = createEncryptedChannel(this._connection, this._app, auth.key, auth.serverSalt);
            callback(auth);
        });
    }
    if (this._connection && this._connection.isConnected()) {
        mt.auth.createAuthKey(
            utility.createEventEmitterCallback('authKeyCreate', this),
            new mt.net.RpcChannel(this._connection));
    } else {
        var msg = 'Client is not yet connected! Wait until it\'s connected before call this method!';
        logger.error(msg);
        this.emit('error', new Error(msg));
    }
};


// ***
// client.**getDataCenterList([callback])**

// Gets the data center list, the current data center and the nearest one

// The code:
Client.prototype.getDataCenters = function (callback) {
    if (callback) {
        this.once('dataCenter', callback);
    }
    if (this.isReady(true)) {
        var self = this;
        try {
            api.service.help.getConfig({
                props: {},
                channel: self._channel,
                callback: function (ex, config) {
                    if (ex) {
                        self.emit('error', ex);
                    } else {
                        var dcs = {
                            toPrintable: tl.utility.toPrintable
                        };
                        var dcList = config.dc_options.list;
                        for (var i = 0; i < dcList.length; i++) {
                            var dc = dcList[i];
                            dcs['DC_' + dc.id] = {
                                host: dc.ip_address,
                                port: dc.port,
                                toPrintable: tl.utility.toPrintable
                            };
                        }
                        api.service.help.getNearestDc({
                            props: {},
                            channel: self._channel,
                            callback: function (ex, nearestDc) {
                                if (ex) {
                                    logger.error('error: ', ex);
                                    self.emit('error', ex);
                                } else {
                                    dcs.current = 'DC_' + nearestDc.this_dc;
                                    dcs.nearest = 'DC_' + nearestDc.nearest_dc;
                                    self.emit('dataCenter', dcs);
                                }
                            }
                        });
                    }
                }
            });
        } catch (err) {
            this.emit('error', err);
        }
    }
};


// ***
// client.**isReady()**

// Checks if the client is ready to communicate with Telegram and immediately emits the error-event if required

// The code:
Client.prototype.isReady = function (emitError) {
    var isReady = this._channel ? true : false;
    if (!isReady && emitError) {
        var msg = 'Client is not yet ready!';
        logger.error(msg);
        this.emit('error', new Error(msg));
    }
    return isReady;
};


// ***
// client.**end([callback])**

// Closes the communication with the DataCenter,

// The last parameter **callback** will be added as a listener for the `end` event

// The code:
Client.prototype.end = function (callback) {
    if (callback) {
        this.once('end', callback);
    }
    this._connection.close(utility.createEventEmitterCallback('end', this));
};


// ***
// _connect()_

// Establishes the connection with the data center _(private)_

// The code:
function connect() {
    this._connection.connect(utility.createEventEmitterCallback('connect', this));
}


// ***
// **Event: 'connect'**
// Emitted when the client connection is successfully established. See **createClient()**.

// **Event: 'authKeyCreate'**
// Emitted when the  authKey is successfully created. See client.**createAuthKey()**.

// **Event: 'dataCenter'**
// Emitted when the data-center map is available. See client.**getDataCenters()**.

// **Event: 'end'**
// Emitted when the data center close the connection. See client.**end()**.

// **Event: 'error'**
// Emitted when an error occurs.

// ***


// Export the internals
exports.createClient = createClient;
exports.retrieveAuthKey = retrieveAuthKey;
var staticInfo = require('./static');
exports.TEST_PRIMARY_DC = staticInfo.telegram.test.primaryDataCenter;
exports.PROD_PRIMARY_DC = staticInfo.telegram.prod.primaryDataCenter;