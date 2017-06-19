export const DelayEffectIdentifier = {
	toString(): '@sagalight/effect/delay' {
		return '@sagalight/effect/delay';
	}
}

export interface IDelayEffectDescription {
	effectIdentifier: typeof DelayEffectIdentifier;
	delay: number;
}

export function delay(delay: number): IDelayEffectDescription {
	return {
		effectIdentifier: DelayEffectIdentifier,
		delay
	};
}

export const DelayEffect: ICancellableEffect<IDelayEffectDescription, void> = {
	canResolveResult(result: IteratorResult<IDelayEffectDescription>): result is IteratorResult<IDelayEffectDescription> {
		return result.value && result.value.effectIdentifier === DelayEffectIdentifier;
	},
	run(result: IteratorResult<IDelayEffectDescription>, runData: IEffectRunData) {
		const { delay } = result.value;

		const timeout = setTimeout(() => {
			runData.next(null, null);
		}, delay);

		return {
			cancel: () => clearTimeout(timeout)
		};
	}
}
