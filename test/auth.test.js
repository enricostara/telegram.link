require('should');
require('requirish')._(module);
var telegramLink = require('lib/telegram.link')();
var api = require('lib/api');


describe('auth', function () {

    var primaryDC = telegramLink.TEST_PRIMARY_DC;

    describe('#sendCode()', function () {
        api.service.auth.sendCode = function (input) {
            input.callback(null, true);
        };
        it('should returns ok', function (done) {
            var client = telegramLink.createClient({authKey: {}}, primaryDC, function () {
                client.auth.sendCode('1234', 5, 'en', function (result) {
                    result.should.be.ok;
                    done();
                })
            });
        });
        it('should returns error', function (done) {
            var client = telegramLink.createClient({}, primaryDC, function () {
                client.once('error', function (ex) {
                    console.log('Error: %s', ex);
                    ex.should.be.ok;
                    client.end(done);
                });
                client.auth.sendCode('1234', 5, 'en', function () {
                })
            });
        });
    });
});
