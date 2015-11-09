//     telegram.link
//     Copyright 2014 Enrico Stara 'enrico.stara@gmail.com'
//     Released under the MIT License
//     http://telegram.link


// Dependencies:
var api = require('../api');
var utility = require('../utility');


// ***

// This module wraps API methods required to manage notifications and settings

// See [Api Methods](https://core.telegram.org/methods#working-with-notifications-settings)

// Access only via Client object (like client.account) and `account` instance property

function Account(client) {
    this.client = client;
}


// ***

// **Event: **`'method name'`

// Each of the following methods emits an event with the same name when done, an `error` event otherwise.


// ***
// account.**updateStatus(offline, [callback])**

// Return a Promise to update the online user status..

// [Click here for more details](https://core.telegram.org/method/account.updateStatus)

// The code:
Account.prototype.updateStatus = function (offline, callback) {

    offline = offline === false ? new api.type.BoolFalse() :
        ( offline === true ? new api.type.BoolTrue() : offline);

    return utility.callService(api.service.account.updateStatus, this.client, this.client._channel, callback, arguments);
};



// Exports the class
module.exports = exports = Account;
