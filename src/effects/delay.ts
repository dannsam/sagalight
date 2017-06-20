import { IEffectRunData, IEffect } from '../core/types';
import { createEffect } from '../core/util';

export interface IDelayEffectData {
	delay: number;
}

export interface IDelayEffect extends IEffect<IDelayEffectData, null> {
	(delay: number): IDelayEffectData;
}

const isStandardEffect = true;

const dataFn = (delay: number) => ({ delay });

const resolver = (result: IteratorResult<IDelayEffectData>, runData: IEffectRunData<null>) => {
	const { delay } = result.value;

	const timeout = setTimeout(
		() => {
			runData.next(null, null);
		},
		delay);

	return {
		cancel: () => clearTimeout(timeout),
	};
};

export const delay: IDelayEffect = createEffect('delay', dataFn, resolver, isStandardEffect);
