import { StandardEffect } from '../effects/standard';
import { ICancellableEffect, IEffectCollection, IEffect } from './types';

export function getEffect<TInput = any>(result: IteratorResult<TInput>, effects: IEffectCollection): (IEffect | ICancellableEffect) {
	for (let i = 0; i < effects.length; i++) {
		const e = effects[i];
		if (e.canResolveResult(result)) {
			return e;
		}
	}

	return StandardEffect;
}
