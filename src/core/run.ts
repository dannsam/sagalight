import { CancelledEffect } from '../effects/cancelled';
import { ForkEffect } from '../effects/fork';
import { ResolvePromiseEffect } from '../effects/resolvePromise';
import { DelayEffect } from '../effects/delay';
import { TakeEffect } from '../effects/take';
import { Task } from './task';
import { isFunction } from './util';
import { IIteratorFactory, IRunOptions, ITaskOptions, IEffectCollection } from './types';

function run<T>(factory: IIteratorFactory<T>, ...args: any[]): Task<T>;
function run<T>(options: IRunOptions, factory: IIteratorFactory<T>, ...args: any[]): Task<T>;
function run<T>(optionsOrFactory: IRunOptions | IIteratorFactory<T>, factoryOrFirstArg: IIteratorFactory<T> | any, ...args: any[]): Task<T> {
	let options: IRunOptions;
	let factory: IIteratorFactory<T>;

	if (typeof optionsOrFactory === 'function') {
		// no options passed then options is factory and factory is the first arg 
		args.unshift(factoryOrFirstArg);
		factory = optionsOrFactory;
		options = {};
	} else {
		options = optionsOrFactory;
		factory = factoryOrFirstArg;
	}

	const taskOptions: ITaskOptions = {
		effects: options.effects instanceof Array ? options.effects : standardEffects(),
		input: options.input,
		callback: (error: Error) => {
			if (error && !isFunction(options.callback)) {
				// unhandled rejection - throw 
				throw error;
			}
		},
	};

	options.effects = options.effects instanceof Array ? options.effects : standardEffects();

	const iterator = factory(...args);
	const task = new Task(factory.name, iterator, taskOptions);

	task.start();

	return task;
}

export { run };

function standardEffects(): IEffectCollection {
	return [
		ResolvePromiseEffect,
		CancelledEffect,
		ForkEffect,
		DelayEffect,
		TakeEffect,
	];
}
