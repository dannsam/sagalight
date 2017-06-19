// import { delay } from '../src/effects/delay';
// import run from '../src/run';

// describe('Effect - Delay', () => {

// 	it('cancellable', (done) => {
// 		const task = run(function* () {
// 			// starts ever-lasting effect
// 			debugger;
// 			yield delay(200);
// 			debugger;
// 			throw new Error('should be cancelled');
// 		});
		
// 		task.done.then(done);
		
// 		task.cancel();
// 	});
// });

// let cancelledEffect = false;

// const TestCancellableEffect: ICancellableEffect = {
// 	canResolveResult(result): result is any {
// 		return true;
// 	},
// 	run(result, runData) {
// 		// ever lasting effect
// 		return {
// 			cancel() {
// 				cancelledEffect = true;
// 			},
// 		};
// 	},
// };

// const task = run({ effects: [TestCancellableEffect] }, function* test() {
// 	// starts ever-lasting effect
// 	yield null;
// });

// task.cancel();

// console.log(`cancelledEffect ${cancelledEffect} should be true`);

// console.log(`task.isComplete ${task.isCompleted} should be true`);
