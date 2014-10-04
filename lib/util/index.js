//       telegram.link
//
//       Copyright 2014 Enrico Stara 'enrico.stara@gmail.com'
//       Released under the MIT license
//       http://telegram.link

// Import dependencies
var BigInteger = require('jsbn');

// Export
exports.createMessageId = createMessageId;
exports.runSeries = runSeries;
exports.retrieveArgumentNames = retrieveArgumentNames;
exports.retryUntilItsDone = retryUntilItsDone;
exports.Logger = require('./logger');

// Run an `Array of tasks` (you can mix synchronous and asynchronous tasks) in `series`, calling back when done or
// if some exceptions occur.
// - Each task must be a `Function` and all the async tasks must have the first argument named `callback`
// in order to be recognised as asynchronous task.
// - Synchronous task will be automatically executed surrounded by a try/catch statement,
// any exceptions will stop the flow and will be propagated to the main callback as first argument.
// - ASynchronous task must manage any exception internally and propagate it to callback as first argument.
// - The `callback` and `tasks` arguments are mandatory (`callback` can be null but be present anyway),
// the subsequent arguments (if any) will be passed to the first task.
function runSeries(callback, tasks) {
    var logger = require('./logger')('util.runSeries');
    if (!tasks || tasks.length === 0) {
        if (logger.isDebugEnabled()) {
            logger.debug('Illegal argument, you must provide a not empty task list.');
        }
        return;
    }
    // Retrieve all the main arguments, they will be passed to the first task
    var firstTaskArgs = Array.prototype.slice.call(arguments);
    // First argument, the 'exception',  will be null
    firstTaskArgs[0] = null;
    // 'runTask' function manage each task execution, both sync and async
    var runTask = function (ex) {
        // Exit on exception
        if(ex) {
            logger.error("Exception occurs: %s", JSON.stringify(ex));
            callback(ex);
            return;
        }
        // Retrieve all the arguments
        var taskArgs = Array.prototype.slice.call(arguments);
        // Take the current task if any
        var currentTask = tasks[0];
        // Check if still there is a task to run like there's no tomorrow... :)
        if (currentTask) {
            // Prepare to the next
            tasks.shift();
            // Check if the task first argument name is 'callback'
            var isAsync = retrieveArgumentNames(currentTask)[0] == 'callback';
            if (logger.isDebugEnabled()) logger.debug('Run %s task \'%s\'..',
                (isAsync ? 'async' : 'sync'), currentTask.name);
            // ASynchronous Task
            if(isAsync) {
                // First argument will be the callback wrapper to run the next task
                taskArgs[0] = runTask;
                // Run the current async task
                currentTask.apply(this, taskArgs);
            }
            // Synchronous Task
            else {
                try{
                    // Discard the 'exception' first argument
                    taskArgs.shift();
                    // Run the current sync task
                    var result = currentTask.apply(this, taskArgs);
                    // Run the next task passing the current task result
                    runTask(null, result);
                } catch (exc) {
                    // Pass the exception to the task runner
                    runTask(exc);
                }
            }
        } else {
            callback.apply(this, taskArgs);
        }
    };
    // run first task
    runTask.apply(this, firstTaskArgs);
}

// Call the async task until succeeds or the retries limit has been reached (the default is 10 attempts)
// - All the arguments are mandatory (`callback` and `retriesLimit` can be null but be present anyway),
// the subsequent arguments (if any) will be passed to the task.
function retryUntilItsDone(callback, retriesLimit, task) {
    var logger = require('./logger')('util.retryUntilItsDone');
    if (!callback || !task) {
        if (logger.isDebugEnabled()) {
            logger.debug('Illegal argument, you must provide the task.');
        }
        return;
    }
    var attempts = [];
    var limit = (retriesLimit && retriesLimit > 0 ? retriesLimit : 10);
    for (var i = 0; i < limit; i++) {
        attempts.push(task);
    }
    var attemptNumber = 0;
    var mainArgs = Array.prototype.slice.call(arguments, 2);
    (function attempt(ex1, attempts) {
        var current = attempts[0];
        if (current) {
            attemptNumber++;
            if (logger.isDebugEnabled()) logger.debug('Attempt number %s..', attemptNumber);
            mainArgs[0] = function (ex2) {
                if (ex2) {
                    attempts.shift();
                    attempt(ex2, attempts);
                    return;
                }
                if (logger.isDebugEnabled()) logger.debug('Done at the attempt n.%s', attemptNumber);
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

// Create a message ID starting from the local time
function createMessageId() {
    var time = new BigInteger(new Date().getTime().toString());
    time = time.divide(new BigInteger((1000).toString()));
    return time.shiftLeft(32).toString();
}

// Retrieve a list of argument name of the given function - thanks John! :)
function retrieveArgumentNames(func) {
    var found = /^[\s\(]*function[^(]*\(\s*([^)]*?)\s*\)/.exec(func.toString());
    return found && found[1] ? found[1].split(/,\s*/) : [];
}

