require('should');
require('requirish')._(module);
var telegramLink = require('lib/telegram.link')();
var net = require('telegram-mt-node').net;
var api = require('lib/api');


describe('TelegramLink', function () {

    var primaryDC = telegramLink.TEST_PRIMARY_DC;

    function getApp() {
        return {
            id: require('lib/static').telegram.test.app.id,
            hash: require('lib/static').telegram.test.app.hash,
            version: '1.0.0',
            lang: 'en'
        };
    }

    describe('#createClient()', function () {
        it('should create a client', function () {

            var app = getApp();
            var client = telegramLink.createClient(app, primaryDC);
            client.should.be.ok;
            client._app.id.should.equal(app.id);
            client._app.should.have.properties(['id', 'hash', 'version', 'lang']);
            (!client._channel).should.be.true;

            app.authKey = {id: 'id'};

            client = telegramLink.createClient(app, primaryDC);
            client.should.be.ok;
            client._app.should.have.properties(['id', 'hash', 'version', 'lang', 'authKey']);
            client.isReady().should.be.true;
        });
    });

    describe('#createClient()', function () {
        it('should callback on the HTTP connection event', function (done) {

            var app = getApp();
            telegramLink.createClient(app, primaryDC, function () {
                done();
            });
        });
    });

    describe('#createClient()', function () {
        it('should callback on the TCP connection event', function (done) {

            var app = getApp();
            app.connectionType = 'TCP';
            var client = telegramLink.createClient(app, primaryDC, function () {
                client._connection.should.be.an.instanceOf(net.TcpConnection);
                client.end(function () {
                    done();
                });
            });
            client.on('error', function (ex) {
                console.error(ex);
                done();
            })
        });
    });

    describe('#createAuthKey()', function () {
        var app = getApp();
        var auth = require('telegram-mt-node').auth;
        // mock the 'createAuthKey' function
        auth.createAuthKey = function (callback, channel) {
            setTimeout(function () {
                if (channel) {
                    callback(null, {
                        key: new auth.AuthKey('id', 'value'),
                        serverSalt: 'serverSalt'
                    });

                } else {
                    callback(new Error('no channel'));
                }
            }, 0);
        };
        it('should returns AuthKey', function (done) {
            var client = telegramLink.createClient(app, primaryDC, function () {
                console.log('%s connected', client);
                client.createAuthKey(function (auth) {
                    auth.key.should.be.ok;
                    auth.serverSalt.should.be.ok;
                    console.log('Auth key OK: %s', auth.key.toString());
                    client._app.should.have.properties(['id', 'hash', 'version', 'lang']);
                    client.isReady().should.be.true;
                    client.end(done);
                });
            });
        });
        it('should returns an error', function (done) {
            var client = telegramLink.createClient(app, primaryDC, function () {
                var conn = client._connection;
                client._connection = null;
                client.once('error', function (ex) {
                    console.log('Error: %s', ex);
                    ex.should.be.ok;
                    client._connection = conn;
                    client.end(done);
                });
                client.createAuthKey(function () {
                });
            });
        });
    });


    describe('#getDataCenters()', function () {
        api.service.help.getConfig = function (input) {
            input.callback(null, {dc_options: {list: [{id: 1}]}});
        };
        api.service.help.getNearestDc = function (input) {
            input.callback(null, {this_dc: 1, nearest_dc: 1});
        };
        it('should returns ok', function (done) {
            var client = telegramLink.createClient({authKey: {}}, primaryDC, function () {
                client.getDataCenters(function (result) {
                    result.should.be.ok;
                    result.should.have.properties(['DC_1', 'current', 'nearest']);
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
                client.getDataCenters(function () {
                })
            });
        });
    });
});
