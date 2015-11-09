//     telegram.link
//     Copyright 2014 Enrico Stara 'enrico.stara@gmail.com'
//     Released under the MIT License
//     http://telegram.link


// Dependencies:
var api = require('../api');
var utility = require('../utility');


// ***

// This module wraps API methods required to manage the messages.

// See [Api Methods](https://core.telegram.org/methods#working-with-messages)

// Access only via Client object (like client.messages) and `messages` instance property

function Messages(client) {
    this.client = client;
}


// ***

// **Event: **`'method name'`

// Each of the following methods emits an event with the same name when done, an `error` event otherwise.


// ***
// messages.**getDialogs(offset, max_id, limit, [callback])**

// Return a Promise to get the current user dialog list.

// [Click here for more details](https://core.telegram.org/method/messages.getDialogs)

// The code:
Messages.prototype.getDialogs = function (offset, max_id, limit, callback) {
    return utility.callService(api.service.messages.getDialogs, this.client, this.client._channel, callback, arguments);
};

// ***
// messages.**getHistory(peer, offset, max_id, limit, [callback])**

// Return a Promise to get the message history for a chat.

// [Click here for more details](https://core.telegram.org/method/messages.getHistory)

// Usage example (`user_id` must be a real contact id, of course):

//      var api = require('telegram.link')();
//
//      var client = api.createClient( ...
//
//      var peer = new api.type.InputPeerContact({
//           props: {
//                user_id: 12345678
//           }
//      });
//
//      client.messages.getHistory(
//           peer,
//           0, 0,
//           10  // num of messages to be returned
//      ).then(function(messages) {
//           console.log('messages:', messages.toPrintable());
//      });

// The code:
Messages.prototype.getHistory = function (peer, offset, max_id, limit, callback) {
    return utility.callService(api.service.messages.getHistory, this.client, this.client._channel, callback, arguments);
};

// ***
// messages.**readHistory(peer, max_id, offset, read_contents, [callback])**

// Return a Promise to mark the message history as read..

// [Click here for more details](https://core.telegram.org/method/messages.readHistory)


// The code:
Messages.prototype.readHistory = function (peer, max_id, offset, read_contents, callback) {

    read_contents = read_contents === false ? new api.type.BoolFalse() :
        ( read_contents === true ? new api.type.BoolTrue() : read_contents);

    return utility.callService(api.service.messages.readHistory, this.client, this.client._channel, callback, arguments);
};

// ***
// messages.**sendMessage(peer, message, random_id, [callback])**

// Return a Promise to send a message to the peer.

// [Click here for more details](https://core.telegram.org/method/messages.sendMessage)

// Usage example (`user_id` must be a real contact id, of course):

//      var api = require('telegram.link')();
//
//      var client = api.createClient( ...
//
//      var peer = new api.type.InputPeerContact({
//           props: {
//                user_id: 12345678
//           }
//      });
//
//      client.messages.sendMessage(
//           peer,
//           'My UTF8 first msg!!',
//           9876543211  // random id...
//      ).then(function(sentMsg) {
//           console.log('sentMsg:', sentMsg.toPrintable());
//      });

// The code:
Messages.prototype.sendMessage = function (peer, message, random_id, callback) {
    return utility.callService(api.service.messages.sendMessage, this.client, this.client._channel, callback, arguments);
};

// Export the class.
module.exports = exports = Messages;
