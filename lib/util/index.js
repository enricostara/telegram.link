//       telegram.link
//
//       Copyright 2014 Enrico Stara 'enrico.stara@gmail.com'
//       Released under the MIT license
//       http://telegram.link

// Import dependencies
var BigInteger = require('jsbn');

// Export
exports.createMessageId = createMessageId;
exports.retryUntilItsDone = retryUntilItsDone;
exports.Logger = require('./logger');

// Create a message ID starting from local time
function createMessageId() {
    var time = new BigInteger(new Date().getTime().toString());
    time = time.divide(new BigInteger((1000).toString()));
    return time.shiftLeft(32).toString();
}

// Call the async task until succeeds or the retries limit has been reached (default 10)
function retryUntilItsDone(task, retriesLimit, callback) {
    var logger = require('./logger')('util.retryUntillItsDone');

    var attempts = [];
    var limit = (retriesLimit && retriesLimit > 0 ? retriesLimit : 10);
    for(var i = 0; i < limit; i++) {
        attempts.push(task);
    }
    var attemptNumber = 0;
    var mainArgs = Array.prototype.slice.call(arguments, 2);
    (function attempt(ex1, attempts) {
        var current = attempts[0];
        if(current) {
            attemptNumber++;
            if(logger.isDebugEnabled()) logger.debug('Attempt number %s..', attemptNumber);
            mainArgs[0] = function(ex2){
                if(ex2) {
                    attempts.shift();
                    attempt(ex2, attempts);
                    return;
                }
                if(logger.isDebugEnabled()) logger.debug('Done at the attempt n.%s', attemptNumber);
                var args = arguments;
                args[0] = null;
                callback.apply(this, args);
            };
            current.apply(this, mainArgs);
        } else {
            logger.warn('Fail, retries limit = %s has been reached!', attemptNumber);
            callback(ex1);
        }
    })(null, attempts);
}