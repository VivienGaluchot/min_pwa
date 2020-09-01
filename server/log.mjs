#!/usr/bin/env node

'use strict';


// logging

function formatLog(level, msg) {
    return `${new Date().toISOString()} - ${level} | ${msg}`;
}

export function logDebug(msg) {
    console.debug(formatLog(`DEBUG`, msg));
}

export function logInfo(msg) {
    console.log(formatLog(`INFO `, msg));
}

export function logError(msg) {
    console.error(formatLog(`ERROR`, msg));
}