
<img src="./telegram.link.png" width="120" />

telegram.link
===

This is an unofficial **javascript library** to connect to **Telegram Messanger** and write a Telegram client that runs 
on the **Node.js** platform and on a standard **web browser**.

### about Telegram Messenger.. 

[Telegram Messenger](http://www.telegram.org ) is a cross-platform messenger whose clients are **open source**. 
Telegram users can exchange encrypted and self-destructing messages, photos, videos and documents (all file-types supported). 
Telegram is officially available for Android and iOS (including tablets and devices without Wi-Fi). 
Unofficial clients for Windows Phone, as well as a web version, OS X version, Linux version and a Windows desktop client 
are available from independent developers using the **Telegram API**
([from Wikipedia](http://en.wikipedia.org/wiki/Telegram_\(software\))).

### about Node.JS..

Node.js is a cross-platform runtime environment for server-side and networking applications. 
Node.js applications are written in JavaScript, and can be run within the Node.js runtime on OS X, Microsoft Windows and 
Linux with no changes ([from Wikipedia](http://en.wikipedia.org/wiki/Node.js)).


## telegram.link in short..

**telegram.link** is an unofficial **porting in javascript** of [Telegram-API](https://core.telegram.org/api). 
With Node.js technology and the javascript language, telegram.link enables to **write once** a Telegram-Client application 
that **runs both on a Node.js server and on a standard web browser** 
(using, in this case, a technology like [browserify](https://www.npmjs.org/package/browserify)).

## Project status

This an **early version**, the current state of progress includes:

- A first implementation of the **Builder** class that reads [Telegram schemas](https://core.telegram.org/schema) 
and writes dynamically **javascript classes and functions** parsing [TypeLanguage](https://core.telegram.org/mtproto/TL).

- A basic **TCP connection**  based on [Telegram protocol spec](https://core.telegram.org/mtproto#tcp-transport). 

- A first [MTProto protocol](https://core.telegram.org/mtproto) implementation to 
[create an authorization key](https://core.telegram.org/mtproto/auth_key) is on going.

- An awesome **Logger** class, based on [debug project](https://github.com/visionmedia/debug), that provide a productive
tool for debugging.

- A **unit-test suite** to cover them all!

### about the logo..

Logo crafted by [Diego Pasquali](http://dribbble.com/diegopq)

## that's it, check back later :)