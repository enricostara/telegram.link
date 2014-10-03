require('should');
var util = require('../../index').util;

describe('util', function () {

    describe('#retryUntilItsDone()', function () {
        it('should retry until limit is reached ', function (done) {
            var i = 0;
            function task(callback, input) {
                setTimeout(function () {
                    i++;
                    callback('err+' + input)
                }, 10);
            }
            util.retryUntilItsDone(task, 5, function (ex) {
                ex.should.be.eql('err+foo');
                i.should.be.equal(5);
                done();
            }, 'foo')
        })
    });
    describe('#retryUntillItsDone()', function () {
        it('should retry until done ', function (done) {
            var i = 0;
            function task(callback, input) {
                setTimeout(function () {
                    i++;
                    if(i===3) {
                        callback(null, i, i, input);
                    } else {
                        callback('err')
                    }
                }, 10);
            }
            util.retryUntilItsDone(task, null, function (ex, arg1, arg2, input) {
                (!ex).should.be.true;
                arg1.should.be.eql(3);
                arg2.should.be.eql(3);
                input.should.be.eql('foo');
                i.should.be.equal(3);
                done();
            }, 'foo');
        })
    });
});
