//     telegram.link
//     Copyright 2014 Enrico Stara 'enrico.stara@gmail.com'
//     Released under the MIT License
//     https://github.com/enricostara/telegram-mt-node

//      TelegramLink class
//
// This is the entry-point of Telegram.link library, and it lists high level methods to communicate
// with `TELEGRAM MESSANGER`

// Print library version
console.log(require('./static').signature);
console.log('v.%s', require('../package.json').version);

// Register the project name on the logging sys
var getLogger = require('get-log');
getLogger.PROJECT_NAME = require('../package.json').name;

// Export the class
module.exports = exports = TelegramLink;

// Import dependencies
var flow = require('get-flow');
var auth = require('./auth');
var TcpConnection = require('telegram-mt-node').net.TcpConnection;
var HttpConnection = require('telegram-mt-node').net.HttpConnection;


// The constructor requires a primary telegram DataCenter address as argument
function TelegramLink(primaryDC, connectionType) {
    if (connectionType && 'TCP' === connectionType) {
        this._connection = new TcpConnection(primaryDC);
    } else {
        this._connection = new HttpConnection(primaryDC);
    }
}

// The method creates a connection to the DataCenter,
// provide a callback function to know when is done or to catch an error
TelegramLink.prototype.connect = function (callback) {
    this._connection.connect(callback);
};

// The method states the authorization key with the DataCenter,
// provide a callback function to know when is done or to catch an error
TelegramLink.prototype.authorization = function (callback) {

    var self = this;
    // Run, run, run ...
    flow.retryUntilIsDone(callback, null,
        function (callback) {
            flow.runSeries([
                auth.RequestPQ,
                auth.RequestDHParams,
                auth.SetClientDHParams
            ], callback, self._connection);
        });
};

// The method closes the communication with the DataCenter,
// provide a callback function to know when is done or to catch an error
TelegramLink.prototype.end = function (callback) {
    this._connection.close(callback);
};
