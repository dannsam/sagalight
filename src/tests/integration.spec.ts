import { runSaga } from '../core/runSaga';
import { Stream } from '../core/stream';
import { cancelled } from '../effects/cancelled';
import { fork } from '../effects/fork';
import { take } from '../effects/take';
import { delay } from '../effects/delay';

fit('integration', (done) => {
	const input = new Stream();

	function* processInput(input: string, output: Stream) {
		let message = 'debouncing value';

		try {

			console.log(message, input);
			yield delay(100);

			message = 'sending value to the server';
			console.log(message, input);
			yield delay(500);

			message = 'processing result from the server';

			yield fork(processResultFromTheServer, 'server_result', output);

			const resultFromFork = yield take(() => true, output);
			console.log('resultFromFork', resultFromFork);
		} finally {

			if (yield cancelled()) {
				console.log(`cancelled ${message}`, input);
			} else {
				console.log('finished processing value', input);
			}

		}
	}

	function* processResultFromTheServer(input: string, output: Stream) {
		try {

			console.log('started processingresult from the server', input);
			yield delay(200);
			debugger;
			output.put('all done');

		} finally {

			if (yield cancelled()) {
				console.log(`cancelled inside processingresult`, input);
			} else {
				console.log('finished processing value', input);
			}

		}
	}

	runSaga({ input }, function* () {
		const output = new Stream();
		let lastTask;

		while (true) {
			const input = yield take(() => true);
			if (lastTask) {
				lastTask.cancel();
			}

			lastTask = yield fork(processInput, input, output);
		}
	});

	input.put('one');

	setTimeout(
		() => {
			input.put('two');

			setTimeout(
				() => {
					input.put('three');

					setTimeout(
						() => {
							input.put('four');
						},
						700);
				},
				200);
		},
		100);

});

