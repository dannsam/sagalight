import { IEffect, IEffectRunData } from '../core/types';
import { createEffectFactory } from '../core/util';

const isStandardEffect = true;

const dataFn = () => ({});

const create = (): IEffect<{}, boolean> => {
	return {
		run(_: any, runData: IEffectRunData<boolean>) {
			runData.next(null, runData.isTaskCancelled);
		},
	};
};

export const cancelled = createEffectFactory('cancelled', dataFn, create, isStandardEffect);
