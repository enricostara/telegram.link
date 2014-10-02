require('should');
var staticInfo = require('../lib/static');
var TelegramLink = require('../index');

describe('TelegramLink', function () {

    var primaryDC = staticInfo.telegram.test.primaryDataCenter;

    describe('#connect()', function () {
        it('should connect and disconnect to primary DC', function (done) {
            var telegramLink = new TelegramLink(primaryDC);
            telegramLink.connect(function (ex) {
                if(ex) console.log(ex);
                else telegramLink.end(function (ex) {
                    if(ex) console.log(ex);
                    done();
                });
            });
        })
    });

    describe('#authorization()', function () {
        it('should returns', function (done) {
            var telegramLink = new TelegramLink(primaryDC);
            telegramLink.connect(function () {
                telegramLink.authorization(function (ex) {
                    if(ex) console.log('Authorization KO: %s', ex);
                    else console.log('Authorization OK');
                    telegramLink.end(function (ex) {
                        if(ex) console.log(ex);
                        done();
                    });
                });
            });
        })
    });
});

