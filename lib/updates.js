//     telegram.link
//     Copyright 2014 Enrico Stara 'enrico.stara@gmail.com'
//     Released under the MIT License
//     http://telegram.link


// Dependencies:
var api = require('./api');
var utility = require('./utility');


// ***

// This module wraps API methods required to manage the session updates
// see [Api Methods](https://core.telegram.org/methods#working-with-updates)
// Access only via Client object and **updates** instance property

function Updates(client) {
    this.client = client;
}


// ***

// **Event: 'methodName'**
// Each of the following methods emits an event with the same name when done, an 'error' event otherwise.


// ***
// updates.**getState([callback])**

// Returns a Promise for get the current state of updates.

// The code:
Updates.prototype.getState = function (callback) {
    return utility.callService(api.service.updates.getState, this.client, this.client._channel, callback, arguments);
};

// Exports the class
module.exports = exports = Updates;