require('should');
require('requirish')._(module);
var api = require('lib/api');
var utility = require('lib/utility');

describe('utility', function () {
    describe('#callService()', function () {
        var theCallback;
        var emitter = {
            isReady: function() { return true; },
            once: function(event, callback) {
                console.log('once ', event);
                (typeof callback).should.be.equal('function');
                theCallback = callback;
            },
            emit: function(event, obj) {
                console.log('emit ', event, obj);
                theCallback(obj);
            }
        };
        it('should returns ok', function (done) {
            api.service.auth.testCall = function testCall (input) {
                input.props.should.have.property('first', 1);
                input.props.should.have.property('second', 2);
                input.channel.should.be.equal('channel');
                (typeof input.callback).should.be.equal('function');
                input.callback();
            };
            (function testCall(first, second, callback) {
                var promise = utility.callService(api.service.auth.testCall, emitter, 'channel', callback, arguments);
                promise.should.be.an.instanceOf(Promise);
                promise.then(done);
            })(1, 2, done);
        });
    });
});
