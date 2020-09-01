#!/usr/bin/env node

'use strict';


import { logDebug, logInfo, logError } from './log.mjs';

import http from 'http';
import fs from 'fs';
import url from 'url';
import path from 'path';


let mimeMap = new Map();
mimeMap.set(".js", "application/javascript");
mimeMap.set(".mjs", "application/javascript");
mimeMap.set(".json", "application/json");
mimeMap.set(".css", "text/css");
mimeMap.set(".jpeg", "image/jpeg");
mimeMap.set(".jpg", "image/jpeg");
mimeMap.set(".png", "image/png");
mimeMap.set(".svg", "image/svg+xml");


export function initHttpServer() {

    // files

    function sendFile(pathname, response) {
        fs.readFile(pathname, (err, data) => {
            if (err) {
                response.writeHead(404);
                response.end();
                logError("can't read file, " + err);
                return;
            }
            let ext = path.extname(pathname);
            let mime = mimeMap.get(ext);
            if (mime)
                response.setHeader("Content-Type", mimeMap.get(ext));

            response.setHeader("Cache-Control", "public,max-age=3600");
            response.writeHead(200);
            response.end(data);
        });
    }

    // views

    const indexView = (request, response) => {
        sendFile("./client/index.html", response);
    }

    // pages

    let urlMap = new Map();
    urlMap.set("/", indexView);
    urlMap.set("/index", indexView);
    urlMap.set("/index.html", indexView);

    // server

    let port = process.env.PORT;
    if (!port) {
        port = "8080";
        logInfo(`defaulting to port ${port}`);
    }

    const httpServer = http.createServer(function (request, response) {
        var pathname = url.parse(request.url).pathname;
        let view = urlMap.get(pathname);
        if (view) {
            view(request, response);
        } else {
            sendFile("./client/" + pathname, response);
        }
        logInfo(`${response.statusCode} ${request.url}`);
    });
    httpServer.listen(port, function () {
        logInfo(`server listening on port ${port}`);
    });

    return httpServer;
}
