//     telegram.link
//     Copyright 2014 Enrico Stara 'enrico.stara@gmail.com'
//     Released under the MIT License
//     http://telegram.link


// Dependencies:
var api = require('./api');
var utility = require('./utility');


// ***

// This module wraps API methods required to manage the messages.

// See [Api Methods](https://core.telegram.org/methods#working-with-messages)

// Access only via Client object and `messages` instance property

function Messages(client) {
    this.client = client;
}


// ***

// **Event: **`'method name'`

// Each of the following methods emits an event with the same name when done, an `error` event otherwise.


// ***
// messages.**getDialogs(offset, max_id, limit, [callback])**

// Returns a Promise for get the current user dialog list.

// [Click here for more details](https://core.telegram.org/method/messages.getDialogs)

// The code:
Messages.prototype.getDialogs = function (offset, max_id, limit, callback) {
    return utility.callService(api.service.messages.getDialogs, this.client, this.client._channel, callback, arguments);
};

// Exports the class
module.exports = exports = Messages;