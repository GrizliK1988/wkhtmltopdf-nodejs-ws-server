# wkhtmltopdf-nodejs-server

A web socket server that handles pdf create/delete requests that accepts **wkhtmltopdf-nodejs-entity** requests.

# Usage

Server can be created and started like follows:

```
var WsServer = require('wkhtmltopdf-nodejs-server');

var server = new WsServer(3000, '640x480x16'); // <- server will listen requests on *:3000 and wkhtmltopdf will be run
                                               // using **640x480x16** xvfb screen resolution.

server.on('event_name', function() { ... });

server.start();
```

**event_name** can take following values:

- **pdf:create:start** - triggered right before pdf creation started with argument **{CreateRequest} request**
- **pdf:create:success** - triggered when pdf creation succeeded with argument **response: {message: ..., handle: ..., debug: ... (when debug is enabled in request)}**
- **pdf:create:fail** - triggered when pdf creation failed with argument **response: {message: ..., handle: ..., debug: ... (when debug is enabled in request)}**
- **pdf:delete:start** - triggered right before pdf deletion started with argument **handle**
- **pdf:delete:success** - triggered when pdf deletion succeeded with argument **handle**
- **pdf:delete:fail** - triggered when pdf deletion failed with arguments **handle, error**

# Installation with Vagrant box

Wkhtmltopdf requires several dependencies to be installed. For your convenience vagrant box with fully configured 
wkhtmltopdf is offered. To install vagrant box you need **Vagrant** and **Ansible** installed.
