import PromiseResolver from './effects/resolvePromise';

const effects: IEffect[] = [new PromiseResolver()];

export function runEffect<TInput = any>(result: IteratorResult<TInput>, cb: IEffectCallback<any>) {
	let resolved = false;
	for (var i = 0; i < effects.length; i++) {
		var e = effects[i];
		if (!e.canResolve(result)) {
			continue;
		}

		resolved = true;
		e.resolve(result, cb);
	}

	if (!resolved) {
		//return as is
		cb(null, result.value);
	}
}
