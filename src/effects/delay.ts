import { createEffectFactory } from '../core/util';
import { IEffect, IEffectRunData, IWrappedEffectData } from '../core/types';

export interface IDelayEffectData {
	delay: number;
}

const isStandardEffect = true;

const dataFn = (delay: number) => ({ delay });

const create = (): IEffect<IWrappedEffectData<IDelayEffectData>, null> => {
	let timeout: number;

	return {
		run(result: IWrappedEffectData<IDelayEffectData>, runData: IEffectRunData<null>) {
			const { delay } = result.data;

			timeout = setTimeout(
				() => {
					runData.next(null, null);
				},
				delay);
		},
		cancel() {
			clearTimeout(timeout);
		},
	};
};

export const delay = createEffectFactory('delay', dataFn, create, isStandardEffect);
