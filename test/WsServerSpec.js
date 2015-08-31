var mockery = require('mockery'),
    Promise = require('promise');

describe('web socket server tests', function() {
    it('Tests server start', function(done) {
        var functions = {
                serverListen: function(port, calllback) {
                }
            },
            eventHandlers = {},
            socketMock = {
                on: function(name, callback) {
                    eventHandlers['socket.' + name] = callback;
                },
                emit: function() {
                }
            };
        spyOn(functions, 'serverListen').andCallThrough();
        spyOn(socketMock, 'emit');

        mockery.enable({
            warnOnReplace: false,
            warnOnUnregistered: false
        });

        mockery.registerMock('express', function(){});
        mockery.registerMock('http', {
            Server: function() {
                return {
                    listen: functions.serverListen
                };
            }
        });
        mockery.registerMock('socket.io', function() {
            return socketMock;
        });


        var WsServer = require('../index'),
            server = new WsServer(100),
            pdfApiSuccess = {
                createPdf: function() {
                    return new Promise(function(resolve) {
                        resolve();
                    });
                },
                deletePdf: function() {
                    return new Promise(function(resolve) {
                        resolve();
                    });
                }
            },
            pdfApiFail = {
                createPdf: function() {
                    return new Promise(function(resolve, reject) {
                        reject('Fail', ['Start', 'Fails']);
                    });
                },
                deletePdf: function() {
                    return new Promise(function(resolve, reject) {
                        reject('Error');
                    });
                }
            };

        server.pdfApi = pdfApiSuccess;
        spyOn(pdfApiSuccess, 'createPdf').andCallThrough();
        spyOn(pdfApiSuccess, 'deletePdf').andCallThrough();
        spyOn(pdfApiFail, 'createPdf').andCallThrough();
        spyOn(pdfApiFail, 'deletePdf').andCallThrough();

        server.start();
        expect(functions.serverListen).toHaveBeenCalledWith(100, any(Function));
        expect(eventHandlers['socket.connection']).toBeDefined();
        expect(eventHandlers['socket.create']).not.toBeDefined();
        expect(eventHandlers['socket.delete']).not.toBeDefined();

        eventHandlers['socket.connection'](socketMock);

        expect(eventHandlers['socket.create']).toBeDefined();
        expect(eventHandlers['socket.delete']).toBeDefined();

        eventHandlers['socket.create']();
        expect(server.pdfApi.createPdf).toHaveBeenCalled();
        eventHandlers['socket.delete']('handle');
        expect(server.pdfApi.deletePdf).toHaveBeenCalled();

        setTimeout(function() {
            expect(socketMock.emit).toHaveBeenCalledWith('pdf:create:success', any(Object));
            expect(socketMock.emit).toHaveBeenCalledWith('pdf:delete:success');
        }, 5);

        server.pdfApi = pdfApiFail;
        eventHandlers['socket.create']();
        eventHandlers['socket.delete']();
        setTimeout(function() {
            expect(socketMock.emit).toHaveBeenCalledWith('pdf:create:fail', any(Object));
            expect(socketMock.emit).toHaveBeenCalledWith('pdf:delete:fail', 'Error');
        }, 5);

        setTimeout(function() {
            done();
        }, 10);
    });
});