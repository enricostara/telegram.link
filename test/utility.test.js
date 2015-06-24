require('should');
require('requirish')._(module);
var api = require('lib/api');
var utility = require('lib/utility');

describe('utility', function () {
    describe('#callService()', function () {
        var emitter = {
            isReady: function() { return true; },
            once: function(event, callback) {
                console.log('once ', event);
                callback.should.be.equal('callback');
            },
            emit: function(event, error) {
                console.log('emit ', event, error.stack);
            }
        };
        it('should returns ok', function (done) {
            api.service.auth.testCall = function testCall (input) {
                input.props.should.have.property('first', 1);
                input.props.should.have.property('second', 2);
                input.channel.should.be.equal('channel');
                (typeof input.callback).should.be.equal('function');
                done();
            };
            (function testCall(first, second, callback) {
                utility.callService(api.service.auth.testCall, emitter, 'channel', callback, arguments);
            })(1, 2, 'callback');
        });
    });
});
