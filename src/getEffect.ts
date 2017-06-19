import { StandardEffect } from './effects/standard';

export function getEffect<TInput = any>(result: IteratorResult<TInput>, effects: IEffectCollection) {
	let resolved = false;
	for (var i = 0; i < effects.length; i++) {
		var e = effects[i];
		if (e.canResolveResult(result)) {
			return e;
		}
	}

	return StandardEffect;
}
