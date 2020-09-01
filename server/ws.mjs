#!/usr/bin/env node

'use strict';


import { logDebug, logInfo, logError } from './log.mjs';

import websocket from 'websocket';
const { server } = websocket;
const WebSocketServer = server;


class PeerSet {
    constructor() {
        // store peers connection by id
        // id -> connection
        this.peerMap = new Map();
    }

    getConnection(id) {
        return this.peerMap.get(id);
    }

    register(id, connection) {
        if (this.peerMap.has(id)) {
            logError(`peer id collision`);
        } else {
            this.peerMap.set(id, connection);
            logDebug(`peer registered '${id}', count '${this.peerMap.size}'`);
            connection.id = id;
        }
    }

    unregister(id) {
        this.peerMap.delete(id);
        logDebug(`peer unregistered '${id}', count '${this.peerMap.size}'`);
    }
}

function originIsAllowed(origin) {
    logInfo("connection origin " + origin);
    if (origin == "http://127.0.0.1:8080")
        return true;
    if (origin == "http://localhost:8080")
        return true;
    if (origin == "https://dwapp.herokuapp.com")
        return true;
    return false;
}


export function initWsServer(httpServer) {
    const wsServer = new WebSocketServer({
        httpServer: httpServer,
        autoAcceptConnections: false,
        path: "/ws",
    });

    let set = new PeerSet();

    wsServer.on('request', function (request) {
        if (!originIsAllowed(request.origin)) {
            // Make sure we only accept requests from an allowed origin
            request.reject();
            logError(`connection from origin '${request.origin}' rejected.`);
            return;
        }

        try {
            let connection = request.accept('tileak-signaling', request.origin);
            connection.id = null;
            connection.on('message', message => {
                if (message.type === 'binary') {
                    logError(`received binary message of ${message.binaryData.length} bytes`);
                    return
                }
                if (message.type !== 'utf8') {
                    logError(`received non utf8 message of type ${message.type}`);
                }

                let data = JSON.parse(message.utf8Data);
                if (data.id != undefined) {
                    if (connection.id != null) {
                        logError(`connection with id '${connection.id}' already registered`);
                        return;
                    }
                    set.register(data.id, connection);

                } else if (data.to != undefined && data.data != undefined) {
                    let src = connection;
                    let dst = set.getConnection(data.to);
                    let payload = data.data;
                    if (!dst) {
                        logError(`cant forward to '${data.to}', dst not known`);
                        return;
                    }
                    if (src.id == null) {
                        logError(`prevent forward to '${data.to}', src not identified`);
                        return;
                    }
                    logDebug(`forward from '${src.id}'to '${dst.id}' '${JSON.stringify(payload)}'`);

                    dst.sendUTF(JSON.stringify({ from: src.id, data: payload }));
                } else {
                    logError(`unexpected data received ${JSON.stringify(data)}`);
                }
            });
            connection.on('close', (reasonCode, description) => {
                if (connection.id) {
                    set.unregister(connection.id);
                }
            });
        } catch (error) {
            logError(error);
        }
    });

    return wsServer;
}