# wkhtmltopdf-nodejs-server

A websocket server that handles pdf generation from html using wkhtmltopdf.

It accepts following requests:

- **create** for pdf generation: requires options object that can be created using 
**CreateRequest.toObject** method, where CreateRequest is a class from **wkhtmltopdf-nodejs-entity** package.
After request is processed server can respond:
    - **pdf:create:success** with object: {message: String, handle: Integer, debug: String[]: Optional}, where
        - **message** is "Ok" string.
        - **handle** is a unique id that can be used to access pdf file at http://server.address/result_{handle}.pdf.
        - **debug** is an output from wkhtmltopdf. This property exists only if request object from websocket client 
        contains **debug** property that is true.
    - **pdf:create:fail** with object: {message: String, handle: Integer, debug: String[]: Optional}, where
        - **message** contains error message with explanation of why pdf has not been created.
        - **handle** and **debug** are the same fields as for **pdf:create:success** response.
        
- **delete** for removing generated pdf from server: requires **handle** input argument from **pdf:create:success** response.
After this request server will respond:
    - **pdf:delete:success** without parameters if pdf removed successfully.
    - **pdf:delete:fail** with error message that describes why file cannot be removed from server.

# Requirements

To run server you need:

- **wkhtmltopdf** with it's dependencies,
- **nodejs**.

If you are going to use **wkhtmltopdf-nodejs-server** on a machine with operating system without graphical environment, 
then you will need to install display server, for example - **xvfb**, for wkhtmltopdf.

For your convenience **vagrant box** with all necessary software has been created. It can be downloaded here: ...

# Installation

Run **npm install wkhtmltopdf-nodejs-server** command.

# Usage

Server can be created and started like follows:

```
var WsServer = require('wkhtmltopdf-nodejs-server');

var server = new WsServer(3000); // <- server will listen requests on *:3000

// or

var server = new WsServer(3000, 'xvfb', ['-a', '-s "-screen 0 640x480x16"']); // <- if you are running this script on server machine without graphical environment.

//The 2nd argument is a name and the 3rd is a list of arguments that will be provided to display server

server.start();
```

Example of websocket **client** is located here: ...

# Running tests

To run unit tests you can use **npm test** command.