require('should');
var util = require('../../index').util;

describe('util', function () {

    function sTask(input) {
        var value = input || 1;
        return ++value;
    }
    function aTask(callback, input) {
        setTimeout(function () {
            var value = input || 1;
            callback(null, ++value);
        }, 100);
    }
    function eTask() {
        throw {code: 'EXC'};
    }
    function eaTask(callback) {
        setTimeout(function () {
            callback({code: 'AEXC'});
        }, 100);
    }
    describe('#runTask()', function () {
        it('should run sync tasks in series ', function (done) {
            util.runSeries(function (ex, input) {
                (ex == null).should.be.true;
                input.should.be.equal(3);
                done();
            }, [sTask, sTask, sTask])
        })
    });
    describe('#runTask()', function () {
        it('should run async tasks in series ', function (done) {
            util.runSeries(function (ex, input) {
                (ex == null).should.be.true;
                input.should.be.equal(3);
                done();
            }, [aTask, aTask, aTask])
        })
    });
    describe('#runTask()', function () {
        it('should run both async and sync tasks in series ', function (done) {
            util.runSeries(function (ex, input) {
                (ex == null).should.be.true;
                input.should.be.equal(5);
                done();
            }, [aTask, sTask, aTask, sTask, aTask])
        })
    });
    describe('#runTask()', function () {
        it('should block on sync task exception', function (done) {
            util.runSeries(function (ex) {
                ex.should.be.ok;
                ex.code.should.be.equal('EXC');
                done();
            }, [aTask, sTask, eTask, aTask, sTask])
        })
    });
    describe('#runTask()', function () {
        it('should block on async task exception', function (done) {
            util.runSeries(function (ex) {
                ex.should.be.ok;
                ex.code.should.be.equal('AEXC');
                done();
            }, [aTask, sTask, eaTask, aTask, sTask])
        })
    });

    describe('#retryUntilItsDone()', function () {
        it('should retry until limit is reached ', function (done) {
            var i = 0;
            function task(callback, input) {
                setTimeout(function () {
                    i++;
                    callback('err+' + input)
                }, 10);
            }
            util.retryUntilItsDone(function (ex) {
                ex.should.be.eql('err+foo');
                i.should.be.equal(5);
                done();
            }, 5, task, 'foo')
        })
    });
    describe('#retryUntillItsDone()', function () {
        it('should retry until done ', function (done) {
            var i = 0;
            function task(callback, input) {
                setTimeout(function () {
                    i++;
                    if (i === 3) {
                        callback(null, i, i, input);
                    } else {
                        callback('err')
                    }
                }, 10);
            }
            util.retryUntilItsDone(function (ex, arg1, arg2, input) {
                (!ex).should.be.true;
                arg1.should.be.eql(3);
                arg2.should.be.eql(3);
                input.should.be.eql('foo');
                i.should.be.equal(3);
                done();
            }, null, task, 'foo');
        })
    });
    describe('#retrieveArgumentNames()', function () {
        it('should retrieve correct argument names ', function () {
            util.retrieveArgumentNames(function () {
            }).length.should.be.equal(0);
            util.retrieveArgumentNames(function (a, b, c) {
            }).length.should.be.equal(3);
            util.retrieveArgumentNames(function (callback, y, z) {
            })[0].should.be.equal('callback');
        })
    });

});
