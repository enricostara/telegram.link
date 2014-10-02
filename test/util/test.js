require('should');
var util = require('../../index').util;

describe('util', function () {

    describe('#retryUntilItsDone()', function () {
        it('should retry until limit is reached ', function (done) {
            var i = 0;
            function task(callback) {
                setTimeout(function () {
                    i++;
                    callback('err')
                }, 10);
            }
            util.retryUntilItsDone(task, 5, function (ex) {
                ex.should.be.eql('err');
                i.should.be.equal(5);
                done();
            })
        })
    });
    describe('#retryUntillItsDone()', function () {
        it('should retry until done ', function (done) {
            var i = 0;
            function task(callback) {
                setTimeout(function () {
                    i++;
                    if(i===3) {
                        callback(null, i, i);
                    } else {
                        callback('err')
                    }
                }, 10);
            }
            util.retryUntilItsDone(task, null, function (ex, arg1, arg2) {
                (!ex).should.be.true;
                arg1.should.be.eql(3);
                arg2.should.be.eql(3);
                i.should.be.equal(3);
                done();
            })
        })
    });
});
