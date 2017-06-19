import run from '../../src/run';
import { Stream } from '../../src/stream';
import { take } from '../../src/effects/take';

const stream = new Stream();

const task = run({
    input: stream
}, function* () {

    const value = yield take(data => data === 'expectedValue');
    if (value === 'expectedValue') {
        console.log('expectedValue was received by the saga');
    } else {
        throw new Error(`unexpectedValue: ${value} was received by the saga`);
    }

});

stream.put('unexpectedValue');
stream.put('expectedValue');
