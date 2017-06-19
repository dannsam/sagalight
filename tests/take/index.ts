import run from '../../src/run';
import { Stream } from '../../src/stream';
import { take } from '../../src/effects/take';

const input = new Stream();

const task = run({ input }, function* () {

    const value = yield take(data => data === 'expectedValue');
    if (value === 'expectedValue') {
        console.log('expectedValue was received by the saga');
    } else {
        throw new Error(`unexpectedValue: ${value} was received by the saga`);
    }

});

input.put('unexpectedValue');
input.put('expectedValue');
