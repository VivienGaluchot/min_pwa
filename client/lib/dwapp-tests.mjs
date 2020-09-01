import dwapp from './dwapp.mjs';

class TestReporter {
    constructor() {
        this.okCount = 0;
        this.koCount = 0;
    }

    onStart() { }

    onSection(title) { }

    async onUnit(what, executor) {
        this.onUnitStart(what);
        try {
            let result = await executor();
            this.onUnitResult(what, result === true);
        } catch (error) {
            console.error(error);
            this.onUnitResult(what, false);
        }
    }

    onUnitStart(what) { }

    onUnitResult(what, isOk) {
        if (isOk) {
            this.okCount++;
        } else {
            this.koCount++;
        }
    }

    onEnd() { }
}

class LogTestReporter extends TestReporter {
    onStart() {
        super.onStart();
        console.log(`# DWAPP test run`);
    }

    onSection(title) {
        super.onSection(title);
        console.log(`## ${title}`);
    }

    onUnitResult(what, isOk) {
        super.onUnitResult(what, isOk);
        console.log(`- TEST ${what} - ${isOk ? "OK" : "KO"}`);
    }

    onEnd() {
        super.onEnd();
        console.log(`## Recap`);
        if (this.koCount == 0 && this.okCount > 0) {
            console.log(`SUCCESS (OK ${this.okCount}) (KO ${this.koCount})`);
        } else {
            console.log(`FAILURE (OK ${this.okCount}) (KO ${this.koCount})`);
        }
    }
}

function later(delay, value) {
    return new Promise(resolve => setTimeout(resolve, delay, value));
}

async function run(reporter = new LogTestReporter()) {
    reporter.onStart();
    reporter.onSection('API');
    await reporter.onUnit('dwapp module imported', () => dwapp !== undefined);
    await reporter.onUnit('dwapp version well defined', () => dwapp.version == '0.0.0');

    // reporter.onSection('Dummy');
    // for (let i = 0; i < 100; i++) {
    //     await reporter.onUnit(`long ${i}`, async () => {
    //         await later(100);
    //         return true;
    //     });
    // }
    // await reporter.onUnit('fail', () => false);

    reporter.onEnd();
}

export default { run, TestReporter };