
import { fork } from './effects/fork';
import './effects/runPromise';
import run from './run';

function* forked() {
	//yield 5;
	debugger;
	console.log('deferred');

	const result = yield new Promise((resolve, reject) => {
		setTimeout(() => {
			//reject('oh ah');
			resolve(5)
		}, 5000);
	});
	console.log('deferred2');

	console.log('Result is: ', result);
	// setTimeout(() => {
	// 	console.log('5');
	// });

	//yield 6;
	//return 5;
}

//const ad = forked();

//ad.next
function* oi() {
	// yield 5;
	// console.log(5);
	// // yield Promise.reject(new Error('rejection'));
	// // console.log('rejection');
	// yield 7;
	// console.log(7);
	// yield 'a';
	// console.log('a');
	// yield Promise.resolve('promise');
	// console.log('promise');

	//	const a = yield ad;
	const t = yield fork(forked);
	console.log('done, but still forked', t);
};

run({}, oi).done.then(result => {
	console.log('Run succeeded');
}, err => {
	console.error('Run failed', err);
});
