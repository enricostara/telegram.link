//       telegram.link
//
//       Copyright 2014 Enrico Stara 'enrico.stara@gmail.com'
//       Released under the MIT license
//       http://telegram.link

// Export the software release version number
exports.version = '0.0.0';

// Export the project signature to display as banner
exports.signature =
    '  __      __                          ___      __  \n' +
    ' / /____ / /__ ___ ________ ___ _    / (_)__  / /__\n' +
    '/ __/ -_) / -_) _ `/ __/ _ `/  \' \\_ / / / _ \\/  \'_/\n' +
    '\\__/\\__/_/\\__/\\_, /_/  \\_,_/_/_/_(_)_/_/_//_/_/\\_\\ \n' +
    '             /___/  ';

// Export static info published by the Telegram facility
exports.telegram = {
    test: {
        primaryDataCenter: {host: "173.240.5.253", port: "443"}
    },
    prod: {
        primaryDataCenter: {host: "173.240.5.1", port: "443"}
    }
};