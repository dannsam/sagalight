
import run from "./run";

function* oi() {
	yield 5;
	console.log(5);
	yield 7;
	console.log(7);
	yield 'a';
	console.log('a');
	yield Promise.resolve('promise');
	console.log('promise');
};

run(oi);
