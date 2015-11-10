//     telegram.link
//     Copyright 2014 Enrico Stara 'enrico.stara@gmail.com'
//     Released under the MIT License
//     http://telegram.link


// Dependencies:
var api = require('../api');
var utility = require('../utility');


// ***

// This module wraps API methods required to manage the session updates

// See [Api Methods](https://core.telegram.org/methods#working-with-updates)

// Access only via Client object (like client.updates) and `updates` instance property

function Updates(client) {
    this.client = client;
}


// ***

// **Event: **`'method name'`

// Each of the following methods emits an event with the same name when done, an `error` event otherwise.


// ***
// updates.**getState([callback])**

// Return a Promise to get the current state of updates.

// [Click here for more details](https://core.telegram.org/method/updates.getState)

// The code:
Updates.prototype.getState = function (callback) {
    return utility.callService(api.service.updates.getState, this.client, this.client._channel, callback, arguments);
};


// ***
// updates.**getDifference(pts, date, qts, [callback])**

// Return a Promise to get the difference between the current state of updates and transmitted.

// [Click here for more details](https://core.telegram.org/method/updates.getDifference)

// The code:
Updates.prototype.getDifference = function (pts, date, qts, callback) {
    return utility.callService(api.service.updates.getDifference, this.client, this.client._channel, callback, arguments);
};

// Export the class
module.exports = exports = Updates;
