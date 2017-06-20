import { IEffectRunData, ITask, IIteratorFactory, IEffect } from '../core/types';
import { createEffect } from '../core/util';

export interface IForkEffectData {
	factory: IIteratorFactory;
	args: any[];
}

export interface IForkEffect extends IEffect<IForkEffectData, ITask> {
	(factory: IIteratorFactory, ...args: any[]): IForkEffectData;
}

const isStandardEffect = true;

const dataFn = (factory: IIteratorFactory, ...args: any[]): IForkEffectData => {
	return {
		factory,
		args,
	};
};

const resolver = (result: IteratorResult<IForkEffectData>, runData: IEffectRunData<ITask>) => {
	const factory = result.value.factory;

	const iterator = factory(...result.value.args);

	const childTask = runData.scheduleChildTask({
		iterator,
		name: factory.name,
	});

	runData.next(null, childTask);
};

export const fork: IForkEffect = createEffect('fork', dataFn, resolver, isStandardEffect);
