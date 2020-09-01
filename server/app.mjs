#!/usr/bin/env node

'use strict';


import { logDebug, logInfo, logError } from './log.mjs';

import { initHttpServer } from './http.mjs';
import { initWsServer } from './ws.mjs';

const httpServer = initHttpServer();
const wsServer = initWsServer(httpServer);