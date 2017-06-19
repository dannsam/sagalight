
// import run from '../src/run';
// import { fork } from '../src/effects/fork';
// import { delay } from '../src/effects/delay';
// import { cancelled } from '../src/effects/cancelled';

// function* forkedTask() {
// 	try {
// 		yield delay(200);
// 		throw new Error('Timeout is expected to be cancelled along with the forked task');
// 	} finally {
// 		if (yield cancelled()) {
// 			console.log('cancelled effect works as expected');
// 		} else {
// 			throw new Error('cancelled effect should return true');
// 		}
// 	}
// }

// const task = run(function* test() {
// 	const task = yield fork(forkedTask);
// });

// // cancelling task after minor delay - forked tasks start usually delayed
// setTimeout(
// 	() => {
// 		task.cancel();
// 	},
// 	0);
