import { IEffect, IEffectRunData } from '../core/types';
import { createResolverFactory, isIterator } from '../core/util';
import { Task } from '../sagalight';

const isStandardEffect = true;

const create = <T>(): IEffect<Iterator<T>, T> => {
	let task: Task;

	return {
		run(result: Iterator<T>, runData: IEffectRunData<T>) {
			task = new Task(
				`(iterator${runData.taskId})`,
				result, {
					callback: runData.next,
					getEffect: runData.getEffect,
					input: runData.taskInputStream,
					logger: runData.logger,
				}, 
			);

			task.start();
		},
		cancel() {
			if (task) {
				task.cancel();
			}
		},
	};
};

export const iteratorResolver = createResolverFactory('iteratorResolver', isIterator, create, isStandardEffect);
