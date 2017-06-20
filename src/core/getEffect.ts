import { IEffectCollection, IEffect, IEffectRunData } from './types';
import { createResolver } from './util';

const test = () => true;
const resolver = <T>(result: IteratorResult<T>, runData: IEffectRunData<T>) => {
	runData.next(null, result.value);
};

const standardResolver = createResolver('standardResolver', test, resolver);

export function getEffect<TInput = any>(result: IteratorResult<TInput>, effects: IEffectCollection): IEffect {
	for (let i = 0; i < effects.length; i++) {
		const e = effects[i];
		if (e.canResolve(result)) {
			return e;
		}
	}

	return standardResolver;
}
