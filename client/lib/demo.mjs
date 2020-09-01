import dwapp from './dwapp.mjs';
import dwappTests from './dwapp-tests.mjs';


class DemoTestReporter extends dwappTests.TestReporter {
    constructor(reportElement, resultElement) {
        super();
        this.reportElement = reportElement;
        this.reportElement.innerHTML = '';
        this.resultElement = resultElement;
        this.resultElement.innerHTML = 'Not executed';
        this.lastBadge = null;
        this.running = true;
    }

    domLog(text, cssClass = "") {
        let el = document.createElement('div');
        el.setAttribute("class", cssClass);
        el.innerText = text;
        this.reportElement.appendChild(el);
    }

    onStart() {
        super.onStart();
        let el = document.createElement('hr');
        this.reportElement.appendChild(el);
    }

    onSection(title) {
        super.onSection(title);
        this.domLog(`${title}`, 'mt-2 font-weight-bold');
    }

    onUnitStart(what) {
        super.onUnitStart(what);
        let el = document.createElement('div');
        let badge = document.createElement('span');
        badge.innerText = "...";
        badge.setAttribute("class", "badge badge-info");
        el.appendChild(badge);
        let text = document.createElement('span');
        text.innerText = what;
        text.setAttribute("class", "m-2");
        el.appendChild(text);
        this.reportElement.appendChild(el);
        this.lastBadge = badge;
    }

    onUnitResult(what, isOk) {
        super.onUnitResult(what, isOk);
        this.lastBadge;
        this.lastBadge.innerText = isOk ? "ok" : "ko";
        this.lastBadge.setAttribute("class", isOk ? "badge badge-success" : "badge badge-danger");
        this.updateShortResult();
    }

    updateShortResult() {
        if (this.running) {
            this.resultElement.innerHTML = `Tests running (OK ${this.okCount} / ${this.okCount + this.koCount})`;
        } else {
            if (this.koCount == 0 && this.okCount > 0) {
                this.resultElement.innerHTML = `Result : <span class="badge badge-success">success</span> (${this.okCount} / ${this.okCount + this.koCount})`;
            } else {
                this.resultElement.innerHTML = `Result : <span class="badge badge-danger">failure</span> (${this.okCount} / ${this.okCount + this.koCount})`;
            }
        }
    }

    onEnd() {
        super.onEnd();
        this.running = false;
        this.updateShortResult();
    }
}

async function runTests() {
    let reportElement = document.getElementById('demo-test-report');
    let resultElement = document.getElementById('demo-test-result');
    let reporter = new DemoTestReporter(reportElement, resultElement);
    await dwappTests.run(reporter);
}

function clearTests() {
    let reportElement = document.getElementById('demo-test-report');
    let resultElement = document.getElementById('demo-test-result');
    new DemoTestReporter(reportElement, resultElement);
}

function init() {
    console.debug(`dwapp loaded version ${dwapp.version}`);

    let startBnt = document.getElementById('demo-test-start-btn');
    let clearBnt = document.getElementById('demo-test-clear-btn');

    startBnt.addEventListener('click', event => {
        clearBnt.disabled = true;
        startBnt.disabled = true;
        runTests().then(() => {
            clearBnt.disabled = false;
            startBnt.disabled = false;
        });
    });
    clearBnt.addEventListener('click', event => {
        clearTests();
    });

    clearTests();
}

document.addEventListener('DOMContentLoaded', event => init());