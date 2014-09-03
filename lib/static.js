//       telegram.link
//
//       Copyright 2014 Enrico Stara 'enrico.stara@gmail.com'
//       Released under the MIT license
//       http://telegram.link


exports.version = '0.0.0';

exports.signature =
    '  __      __                          ___      __  \n' +
    ' / /____ / /__ ___ ________ ___ _    / (_)__  / /__\n' +
    '/ __/ -_) / -_) _ `/ __/ _ `/  \' \\_ / / / _ \\/  \'_/\n' +
    '\\__/\\__/_/\\__/\\_, /_/  \\_,_/_/_/_(_)_/_/_//_/_/\\_\\ \n' +
    '             /___/  ';

exports.telegram = {
    test: {
        primaryDataCenter: {host: "173.240.5.253", port: "443"}
    },
    prod: {
        primaryDataCenter: {host: "173.240.5.1", port: "443"}
    }
};