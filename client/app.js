"use strict";

const App = function () {
    function initCompute() {
        let inputAEl = document.getElementById("input-a");
        let inputBEl = document.getElementById("input-b");
        let inputOpEl = document.getElementById("input-op");
        let outputEl = document.getElementById("output");

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
        initCompute();
    }

    return {
        init: event => init(),
    }
}();

document.addEventListener("DOMContentLoaded", App.init);