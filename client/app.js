"use strict";

const App = function () {
    function init() {
    }

    return {
        init: event => init(),
    }
}();

document.addEventListener("DOMContentLoaded", App.init);