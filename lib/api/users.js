//     telegram.link
//     Copyright 2014 Enrico Stara 'enrico.stara@gmail.com'
//     Released under the MIT License
//     http://telegram.link


// Dependencies:
var api = require('../api');
var utility = require('../utility');

// ***

// This module wraps API methods required to manage users.

// See [Api Methods](https://core.telegram.org/methods#working-with-users)

// Access only via Client object (like client.users) and `users` instance property

function Users(client) {
    this.client = client;
}


// ***

// **Event: **`'method name'`

// Each of the following methods emits an event with the same name when done, an `error` event otherwise.


// ***
// users.**getFullUser(user_id, [callback])**

// Return a Promise to get extended user info by ID (only users from the contact list supported).

// [Click here for more details](https://core.telegram.org/method/users.getFullUser)

// The code:
Users.prototype.getFullUser = function (id, callback) {
    id = new api.type.InputUserContact({props: {
        user_id: id
    }});

    return utility.callService(api.service.users.getFullUser, this.client, this.client._channel, callback, arguments);
};

// Export the class
module.exports = exports = Users;
