import { ITask, IIteratorFactory, IEffect, IEffectRunData, IWrappedEffectData } from '../core/types';
import { createEffectFactory } from '../core/util';

export interface IForkEffectData {
	factory: IIteratorFactory;
	args: any[];
}

const isStandardEffect = true;

const dataFn = (factory: IIteratorFactory, ...args: any[]): IForkEffectData => ({ factory, args });

const create = (): IEffect<IWrappedEffectData<IForkEffectData>, ITask> => {
	return {
		run(result: IWrappedEffectData<IForkEffectData>, runData: IEffectRunData<ITask>) {
			const factory = result.data.factory;

			const iterator = factory(...result.data.args);

			const childTask = runData.scheduleChildTask({
				iterator,
				name: factory.name,
			});

			runData.next(null, childTask);
		},
	};
};

export const fork = createEffectFactory('fork', dataFn, create, isStandardEffect);
