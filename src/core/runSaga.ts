import { Task } from './task';
import { IIteratorFactory, IRunOptions, ITaskOptions } from './types';
import { isFunction } from './util';
import { getStandardEffects } from './standardEffects';
import { Stream } from './stream';

function runSaga<T>(factory: IIteratorFactory<T>, ...args: any[]): Task<T>;
function runSaga<T>(options: IRunOptions, factory: IIteratorFactory<T>, ...args: any[]): Task<T>;
function runSaga<T>(optionsOrFactory: IRunOptions | IIteratorFactory<T>, factoryOrFirstArg: IIteratorFactory<T> | any, ...args: any[]): Task<T> {
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
		effects: options.effects instanceof Array ? options.effects : getStandardEffects(),
		input: options.input || new Stream(),
		callback: (error: Error) => {
			if (error && !isFunction(options.callback)) {
				// unhandled rejection - throw 
				throw error;
			}
		},
	};

	const iterator = factory(...args);
	const task = new Task(factory.name, iterator, taskOptions);

	task.start();

	return task;
}

export { runSaga };