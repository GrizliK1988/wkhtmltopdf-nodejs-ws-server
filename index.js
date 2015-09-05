var wkhtmlToPdf = require('wkhtmltopdf-nodejs-options-wrapper'),
    app = require('express')(),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    PdfApi = require('wkhtmltopdf-nodejs-pdfapi');

/**
 * Web socket server that handles pdf create/delete requests that accepts wkhtmltopdf-nodejs-entity requests.
 *
 * @param port
 * @param displayServer
 * @param displayServerParameterList
 * @constructor
 */
function WsPdfServer(port, displayServer, displayServerParameterList) {
    this.port = port;
    this.pdfApi = new PdfApi(displayServer, displayServerParameterList);
}

WsPdfServer.prototype = {
    /**
     * Starts websocket server at *:port. Port is provided to constructor.
     */
    start: function() {
        http.listen(this.port, function(){
            console.log('listening on *:' + this.port);
        }.bind(this));

        io.on('connection', this._onSocketConnection.bind(this));
    },

    /**
     * @param socket
     * @private
     */
    _onSocketConnection: function(socket) {
        this.socket = socket;
        socket.on('create', this._createPdf.bind(this));
        socket.on('delete', this._deletePdf.bind(this));
    },

    /**
     * @param options
     * @private
     */
    _createPdf: function(options) {
        var request = new wkhtmlToPdf.CreateRequest(options),
            handle = Date.now();

        this.pdfApi.createPdf(request, 'result_' + handle + '.pdf').then(function(data, debug) {
            this._respondCreateSuccess(handle, request, debug);
        }.bind(this), function(data, debug) {
            this._respondCreateFail(handle, data, request, debug);
        }.bind(this));
    },

    /**
     * @param handle
     * @param {CreateRequest} request
     * @param debug
     * @private
     */
    _respondCreateSuccess: function(handle, request, debug) {
        var response = {
            message: 'Ok',
            handle: handle
        };

        if (request.getDebug()) {
            response.debug = debug;
        }

        this.socket.emit('pdf:create:success', response);
    },

    /**
     * @param handle
     * @param data
     * @param {CreateRequest} request
     * @param debug
     * @private
     */
    _respondCreateFail: function(handle, data, request, debug) {
        var response = {
            message: data.toString(),
            handle: handle
        };

        if (request.getDebug()) {
            response.debug = debug;
        }

        this.socket.emit('pdf:create:fail', response);
    },

    /**
     * @param handle
     * @private
     */
    _deletePdf: function(handle) {
        this.pdfApi.deletePdf('./result_' + handle + '.pdf').then(function() {
            this.socket.emit('pdf:delete:success');
        }.bind(this), function (error) {
            this.socket.emit('pdf:delete:fail', error);
        }.bind(this));
    }
};

module.exports = WsPdfServer;
