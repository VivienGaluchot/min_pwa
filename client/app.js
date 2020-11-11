'use strict';

const SW = function () {

    // private 

    function initCom() {
        let backChannel = new MessageChannel();
        let messageMapHandler = new Map();
        messageMapHandler.set('get_version', (event, data) => {
            console.log(`service worker version ${data}`);
            let el = document.getElementById('sw-version');
            el.innerText = data;
        });
        messageMapHandler.set('has_update', (event, data) => {
            let btn = document.getElementById('btn-update');
            btn.classList.remove('js-hidden');
            btn.onclick = () => {
                document.location.reload();
            };
        });
        backChannel.port1.onmessage = (event) => {
            if (event.data && event.data.type) {
                let handler = messageMapHandler.get(event.data.type);
                if (handler) {
                    handler(event, event.data.data);
                } else {
                    console.warn(`lost message`, event);
                }
            } else {
                console.warn(`lost message`, event);
            }
        };
        backChannel.port1.start();

        let post = (message, transfer) => {
            navigator.serviceWorker.controller.postMessage(message, transfer);
        };
        post({ type: 'init_port' }, [backChannel.port2]);
        post({ type: 'get_version' });

        const channel = new BroadcastChannel('sw-messages');
        channel.addEventListener('message', event => {
            console.log('Received', event.data);
        });
    }

    // public 

    function init() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(function (reg) {
                if (reg.installing) {
                    console.log('service worker installing');
                } else if (reg.waiting) {
                    console.log('service worker installed');
                } else if (reg.active) {
                    console.log('service worker active');
                }
            }).catch(function (error) {
                console.warn('service worker registration failed', error);
            });

            if (navigator.serviceWorker.controller) {
                initCom();
            } else {
                console.log('page not currently controlled by a service worker');
            }
        } else {
            console.warn('service worker not available');
        }
    }

    return {
        init: () => init(),
    }
}();


const App = function () {

    // private 

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

    function setupDummyForm() {
        let inputTick = document.getElementById("dummy-tick");
        let inputChoice = document.getElementById("dummy-choice");
        let inputNote = document.getElementById("dummy-note");

        let inputClick = document.getElementById("dummy-click");
        let outputCount = document.getElementById("dummy-click-count");
        let inputReset = document.getElementById("dummy-reset");

        let clickCount = null;
        function setInputClick(count) {
            clickCount = count;
            outputCount.innerText = `${count}`;
        }
        function getInputClick() {
            return clickCount;
        }
        setInputClick(0);

        // storage get

        function reload() {
            function read(key, apply) {
                var value = localStorage.getItem(key);
                if (value !== null) {
                    apply(value);
                }
            }
            read('form-tick', (value) => { inputTick.checked = value });
            read('form-choice', (value) => { inputChoice.selectedIndex = value });
            read('form-note', (value) => { inputNote.value = value });
            read('form-click', (value) => { setInputClick(Number(value)) });
        }

        //localStorage.onChanged.addListener(() => { reload() });
        reload();

        // storage set

        inputClick.onclick = () => {
            setInputClick(getInputClick() + 1);
            localStorage.setItem('form-click', getInputClick());
        };
        inputReset.onclick = () => {
            setInputClick(0);
            localStorage.setItem('form-click', getInputClick());
        };

        inputTick.onchange = () => {
            localStorage.setItem('form-tick', inputTick.checked);
        };
        inputChoice.onchange = () => {
            localStorage.setItem('form-choice', inputChoice.selectedIndex);
        };
        inputNote.onchange = () => {
            localStorage.setItem('form-note', inputNote.value);
        };
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

    // Public

    function init() {
        SW.init();
        setupDateTimeUpdater();
        setupOnlineStatusChecker();
        setupDummyForm();
        setupComputer();
    }

    return {
        init: event => init(),
    }
}();

document.addEventListener('DOMContentLoaded', App.init);