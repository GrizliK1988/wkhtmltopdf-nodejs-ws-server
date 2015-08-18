var _ = require('underscore'),
    Backbone = require('backbone'),
    spawn = require('child_process').spawn,
    wkhtmlToPdf = require('wkhtmltopdf-nodejs-entity'),
    app = require('express')(),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    fs = require('fs');

/**
 * Web socket server that handles pdf create/delete requests.
 *
 * There are events that can be used for customizing server behavior:
 *
 * **pdf:create:start** - triggered right before pdf creation started with argument {CreateRequest} request
 * **pdf:create:success** - triggered pdf creation succeeded with argument response: {message: ..., handle: ..., debug: ... (when debug is enabled in request)}
 * **pdf:create:fail** - triggered pdf creation failed with argument response: {message: ..., handle: ..., debug: ... (when debug is enabled in request)}
 *
 * **pdf:delete:start** - triggered right before pdf deletion started with argument handle
 * **pdf:delete:success** - triggered pdf creation succeeded with argument handle
 * **pdf:delete:fail** - triggered pdf creation failed with arguments (handle, error)
 *
 * Constructor accepts 2 arguments:
 *  - **port** which is used by websocket server
 *  - **displayServerResolution** which is provided to xvfb-run command. default value is 640x480x16.
 *
 * Example of server usage is located in **example.js** file.
 *
 * @param port
 * @param displayServerResolution
 * @constructor
 */
function WsServer(port, displayServerResolution) {
    this.port = port;
    this.displayServerResolution = displayServerResolution || '640x480x16';
    this.debug = [];
}

WsServer.prototype = _.extend({
    /**
     * Starts websocket server
     */
    start: function() {
        http.listen(this.port, function(){
            console.log('listening on *:' + this.port);
        }.bind(this));

        io.on('connection', this.onSocketConnection.bind(this));
    },

    /**
     * @param socket
     */
    onSocketConnection: function(socket) {
        this.socket = socket;
        socket.on('create', this.createPdf.bind(this));
        socket.on('delete', this.deletePdf.bind(this));
    },

    /**
     * @param options
     */
    createPdf: function(options) {
        var request = new wkhtmlToPdf.CreateRequest(options),
            pdfCommandParts = request.toString().split(' ').filter(function(value) {
                return value !== '';
            }),
            commandParts = ['-a', '-s "-screen 0 ' + this.displayServerResolution + '"', 'wkhtmltopdf'],
            handle = Date.now(),
            responseSent = false;

        commandParts = commandParts.concat(pdfCommandParts);
        commandParts.push('result_' + handle + '.pdf');

        this.trigger('pdf:create:start', request);

        var command = spawn('xvfb-run', commandParts);

        command.on('close', function() {
            if (!responseSent) {
                this._respondCreateFail(handle, 'Pdf creation failed. Please see debug for more details.', request);
            }
        }.bind(this));

        command.stdout.on('data', function (data) {
            this.debug.push(data.toString());

            if (data.toString().match(/^Exit with code 1 due to network error/)) {
                this._respondCreateFail(handle, data, request);
                responseSent = true;
            }
            if (data.toString() === 'Done') {
                this._respondCreateSuccess(handle, data, request);
                responseSent = true;
            }
        }.bind(this));

        command.stderr.on('data', function (data) {
            this._respondCreateFail(handle, data, request);
        }.bind(this));
    },

    deletePdf: function(handle) {
        this.trigger('pdf:delete:start', handle);

        fs.unlink('./result_' + handle + '.pdf', function(error) {
            if (error) {
                this.trigger('pdf:delete:fail', handle, error);
                this.socket.emit('pdf:delete:fail', error);
            } else {
                this.trigger('pdf:delete:success', handle);
                this.socket.emit('pdf:delete:success');
            }
        }.bind(this));
    },

    /**
     * @param handle
     * @param data
     * @param {CreateRequest} request
     */
    _respondCreateSuccess: function(handle, data, request) {
        var response = {
            message: data.toString(),
            handle: handle
        };

        if (request.getDebug()) {
            response.debug = this.debug.filter(function(line) {
                return line !== '';
            }).join("\n");
        }

        this.trigger('pdf:create:success', response, handle);
        this.socket.emit('pdf:create:success', response);

        this.debug = [];
    },

    /**
     * @param handle
     * @param data
     * @param {CreateRequest} request
     */
    _respondCreateFail: function(handle, data, request) {
        var response = {
            message: data.toString(),
            handle: handle
        };

        if (request.getDebug()) {
            response.debug = this.debug.filter(function(line) {
                return line !== '';
            }).join("\n");
        }

        this.trigger('pdf:create:fail', response, handle);
        this.socket.emit('pdf:create:fail', response);

        this.debug = [];
    }
}, Backbone.Events);

module.exports = WsServer;
