export const TimeoutEffectIdentifier = {
	toString(): '@sagalight/effect/timeout' {
		return '@sagalight/effect/timeout';
	}
}

export interface ITimeoutEffectDescription<TFunction extends Function = any> {
    effectIdentifier: typeof TimeoutEffectIdentifier;
	delay: number;
    fn: TFunction;
    args: any[];
}

export function timeout<T extends Function>(delay: number, fn: T, ...args: any[]): ITimeoutEffectDescription<T> {
    return {
        effectIdentifier: TimeoutEffectIdentifier,
        fn,
		delay,
        args
    };
}

export const TimeoutEffect: ICancellableEffect<ITimeoutEffectDescription, void> = {
    canResolveResult(result: IteratorResult<ITimeoutEffectDescription>): result is IteratorResult<ITimeoutEffectDescription> {
        return result.value && result.value.effectIdentifier === TimeoutEffectIdentifier;
    },
    run<T extends Function>(result: IteratorResult<ITimeoutEffectDescription<T>>, runData: IEffectRunData<void>) {
        const { delay, fn, args } = result.value;

		const timeout = setTimeout(() => {
			try {
				runData.next(null, fn(args));
			} catch(e) {
				runData.next(e);
			}
		}, delay);

		return {
			cancel(cb) {
				clearTimeout(timeout);
				cb(null);
			}
		};
    }
}
