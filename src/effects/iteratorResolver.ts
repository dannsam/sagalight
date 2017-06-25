import { IEffect, IEffectContext, ICallback, IResolverFactory } from '../core/types';
import { createResolverFactory, isIterator } from '../core/util';
import { Task } from '../sagalight';

const isStandardEffect = true;

const create = <T>(): IEffect<Iterator<T>, T> => {
	let task: Task;

	return {
		run(result: Iterator<T>, next: ICallback<T>, effectContext: IEffectContext) {
			task = new Task(
				`${effectContext.taskId}-iterator`,
				result, {
					callback: next,
					getEffect: effectContext.getEffect,
					input: effectContext.taskInputStream,
					logger: effectContext.logger,
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

export const iteratorResolverFactory: IResolverFactory<Iterator<any>, any> = createResolverFactory('iteratorResolver', isIterator, create, isStandardEffect);
