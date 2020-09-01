'use strict';

const App = function () {
    function setupDateTimeUpdater() {
        let dateTimeEl = document.getElementById('badge-datetime');

        function updateTime() {
            let today = new Date();
            let date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
            let time = today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds();
            let datetime = date + ' ' + time;
            dateTimeEl.innerText = datetime;
            setTimeout(() => {
                updateTime();
            }, 1000);
        }

        updateTime();
    }

    function setupOnlineStatusChecker() {
        let onlineBadgeEl = document.getElementById('badge-online');
        let offlineBadgeEl = document.getElementById('badge-offline');

        let setBadge = isOnline => {
            if (isOnline) {
                onlineBadgeEl.classList.remove('js-hidden');
                offlineBadgeEl.classList.add('js-hidden');
            } else {
                onlineBadgeEl.classList.add('js-hidden');
                offlineBadgeEl.classList.remove('js-hidden');
            }
        }

        setBadge(false);

        let failedAttempt = 0;
        function connectToWebsocketServer() {
            console.debug('websocket | try to connect');

            let wsProtocol;
            if (window.location.protocol != 'http:') {
                wsProtocol = 'wss:';
            } else {
                wsProtocol = 'ws:';
            }
            let ws = new WebSocket(`${wsProtocol}//${location.host}/ws`, 'online-check');

            ws.onopen = () => {
                console.debug('websocket | onopen');
                failedAttempt = 0;
                setBadge(true);
            };

            ws.onmessage = e => {
                console.debug(`websocket | message`, e.data);
            };

            ws.onclose = e => {
                setBadge(false);
                let timeoutInS = 1 + 5 * failedAttempt;
                console.debug(`websocket | onclose, retry in ${timeoutInS} s`);
                failedAttempt++;
                setTimeout(() => {
                    connectToWebsocketServer();
                }, timeoutInS * 1000);
            };

            ws.onerror = err => {
                ws.close();
            };
        }
        connectToWebsocketServer();
    }

    function setupComputer() {
        let inputAEl = document.getElementById('input-a');
        let inputBEl = document.getElementById('input-b');
        let inputOpEl = document.getElementById('input-op');
        let outputEl = document.getElementById('output');

        let inputA = {
            get: () => {
                return inputAEl.value;
            }
        };
        let inputB = {
            get: () => {
                return inputBEl.value;
            }
        };
        let inputOp = {
            get: () => {
                return inputOpEl.value;
            }
        };
        let output = {
            set: value => {
                outputEl.value = value;
            }
        };

        function recompute() {
            let a = Number(inputA.get());
            let b = Number(inputB.get());
            if (a == NaN || b == NaN) {
                output.set(``);
                return;
            }

            let op = null;
            if (inputOp.get() == '+') {
                op = (a, b) => a + b;
            } else if (inputOp.get() == '-') {
                op = (a, b) => a - b;
            } else if (inputOp.get() == 'x') {
                op = (a, b) => a * b;
            } else if (inputOp.get() == '/') {
                op = (a, b) => a / b;
            } else {
                output.set(``);
                return;
            }

            output.set(`${op(a, b)}`);
        }

        inputAEl.onchange = recompute;
        inputAEl.addEventListener('keyup', recompute);
        inputBEl.onchange = recompute;
        inputBEl.addEventListener('keyup', recompute);
        inputOpEl.onchange = recompute;
    }

    function init() {
        setupDateTimeUpdater();
        setupOnlineStatusChecker();
        setupComputer();
    }

    return {
        init: event => init(),
    }
}();

document.addEventListener('DOMContentLoaded', App.init);