import { ITask, IIteratorFactory, IEffect, IEffectRunData } from '../core/types';
import { createEffectFactory } from '../core/util';

export interface IForkEffectData {
	factory: IIteratorFactory;
	args: any[];
}

const isStandardEffect = true;

const dataFn = (factory: IIteratorFactory, ...args: any[]): IForkEffectData => ({ factory, args });

const create = (): IEffect<IForkEffectData, ITask> => {
	return {
		run(result: IteratorResult<IForkEffectData>, runData: IEffectRunData<ITask>) {
			const factory = result.value.factory;

			const iterator = factory(...result.value.args);

			const childTask = runData.scheduleChildTask({
				iterator,
				name: factory.name,
			});

			runData.next(null, childTask);
		},
	};
};

export const fork = createEffectFactory('fork', dataFn, create, isStandardEffect);
