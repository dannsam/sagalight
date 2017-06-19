import { CancelledEffect } from './effects/cancelled';
import { ForkEffect } from './effects/fork';
import { ResolvePromiseEffect } from './effects/resolvePromise';
import { DelayEffect } from './effects/delay';
import { Task } from './task';
import { TakeEffect } from "./effects/take";

function run<T>(factory: IIteratorFactory<T>, ...args: any[]): Task<T>;
function run<T>(options: IRunOptions, factory: IIteratorFactory<T>, ...args: any[]): Task<T>;
function run<T>(o: IRunOptions | IIteratorFactory<T>, factory: IIteratorFactory<T> | any, ...args: any[]): Task<T> {
	let options: IRunOptions;
	if (typeof o === 'function') {
		//no options passed then options is factory and factory is the first arg 
		args.unshift(factory);
		factory = o;
		options = {};
	} else {
		options = o;
	}

	const effects = options.effects || standardEffects();

	const iterator = factory(...args);
	const task = new Task(factory.name, iterator, effects, options.input);

	task.start();

	return task;
}

export default run;

function standardEffects(): IEffectCollection {
	return [
		ResolvePromiseEffect,
		CancelledEffect,
		ForkEffect,
		DelayEffect,
		TakeEffect
	];
}
