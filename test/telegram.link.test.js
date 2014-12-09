require('should');
var staticInfo = require('../lib/static');
var TelegramLink = require('../lib/telegram.link');

describe('TelegramLink', function () {
    var primaryDC = staticInfo.telegram.test.primaryDataCenter;

    describe('#connect()', function () {
        it('should connect and disconnect from a primary DC with HTTP', function (done) {
            var telegramLink = new TelegramLink(primaryDC);
            telegramLink.connect(function (ex) {
                if (ex) console.log(ex);
                else telegramLink.end(function (ex) {
                    if (ex) console.log(ex);
                    done();
                });
            });
        });

        it('should connect and disconnect from a primary DC with TCP', function (done) {
            var telegramLink = new TelegramLink(primaryDC, 'TCP');
            telegramLink.connect(function (ex) {
                if (ex) console.log(ex);
                else telegramLink.end(function (ex) {
                    if (ex) console.log(ex);
                    done();
                });
            });
        });
    });


    describe('#getAuthorization()', function () {
        var callback = function (ex, authKey) {
            var self = arguments.callee;
            if (ex) {
                console.log('Authorization KO: %s', ex);
                self.telegramLink.end();
            }
            else {
                authKey.should.be.ok;
                console.log('Authorization OK: %s', authKey.toString());
                self.telegramLink.end();
            }
            (!ex).should.be.true;
            self.done();
        };

        it('should returns AuthKey using a TCP connection', function (done) {
            this.timeout(120000);
            var telegramLink = new TelegramLink(primaryDC, 'TCP');
            callback.telegramLink = telegramLink;
            callback.done = done;
            telegramLink.getAuthorization(callback);
        });

        it('should returns AuthKey using a HTTP connection', function (done) {
            this.timeout(120000);
            var telegramLink = new TelegramLink(primaryDC);
            callback.telegramLink = telegramLink;
            callback.done = done;
            telegramLink.getAuthorization(callback);
        });
    });
});

