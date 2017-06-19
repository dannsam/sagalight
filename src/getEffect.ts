import { StandardEffect } from './effects/standard';

export function getEffect<TInput = any>(result: IteratorResult<TInput>, effects: IEffectCollection) {
	const resolved = false;
	for (let i = 0; i < effects.length; i++) {
		const e = effects[i];
		if (e.canResolveResult(result)) {
			return e;
		}
	}

	return StandardEffect;
}
