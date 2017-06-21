import { createEffectFactory } from '../core/util';
import { IEffect, IEffectRunData } from '../core/types';

export interface IDelayEffectData {
	delay: number;
}

const isStandardEffect = true;

const dataFn = (delay: number) => ({ delay });

const create = (): IEffect<IDelayEffectData, null> => {
	let timeout: number;

	return {
		run(result: IteratorResult<IDelayEffectData>, runData: IEffectRunData<null>) {
			const { delay } = result.value;

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
