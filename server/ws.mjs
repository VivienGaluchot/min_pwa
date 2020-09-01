#!/usr/bin/env node

'use strict';


import { logDebug, logInfo, logError } from './log.mjs';

import websocket from 'websocket';
const { server } = websocket;
const WebSocketServer = server;


function originIsAllowed(origin) {
    logInfo("connection origin " + origin);
    if (origin == "http://127.0.0.1:8080")
        return true;
    if (origin == "http://localhost:8080")
        return true;
    if (origin == "https://min_pwa.herokuapp.com")
        return true;
    return false;
}


export function initWsServer(httpServer) {
    const wsServer = new WebSocketServer({
        httpServer: httpServer,
        autoAcceptConnections: false,
        path: "/ws",
    });

    wsServer.on('request', function (request) {
        if (!originIsAllowed(request.origin)) {
            // Make sure we only accept requests from an allowed origin
            request.reject();
            logError(`connection from origin '${request.origin}' rejected.`);
            return;
        }

        try {
            let connection = request.accept('online-check', request.origin);
            logInfo(`WS connection accepted`);

            connection.on('message', message => {
                logError(`received unexpected message from client APP`);
            });
            connection.on('close', (reasonCode, description) => {
                logInfo(`WS connection closed`);
            });

        } catch (error) {
            logError(error);
        }
    });

    return wsServer;
}