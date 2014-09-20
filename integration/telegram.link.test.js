require('should');
var staticInfo = require('../lib/static');
var TelegramLink = require('../index');

describe('TelegramLink', function () {

    var primaryDC = staticInfo.telegram.test.primaryDataCenter;

    describe('#connect()', function () {
        it('should connect and disconnect to primary DC', function (done) {
            var telegramLink = new TelegramLink(primaryDC);
            telegramLink.connect(function () {
                telegramLink.end(done, function (error) {
                    console.log(error);
                    done();
                });
            });
        })
    });

    describe('#authorization()', function () {
        it('should returns', function (done) {
            var telegramLink = new TelegramLink(primaryDC);
            telegramLink.connect(function () {
                telegramLink.authorization(function () {
                    console.log("Authorization method returns!");
                    telegramLink.end(done, function (error) {
                        console.log(error);
                        done();
                    });
                });
            });
        })
    });

});

