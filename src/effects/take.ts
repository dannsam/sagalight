export const TakeEffectIdentifier = {
	toString(): '@sagalight/effect/take' {
		return '@sagalight/effect/take';
	}
}

export interface ITakeEffectDescription<T = any> {
	effectIdentifier: typeof TakeEffectIdentifier;
	condition: (data: any) => boolean;
}

export function take<T>(condition: (data: T) => boolean): ITakeEffectDescription<T> {
	return {
		effectIdentifier: TakeEffectIdentifier,
		condition
	};
}

export const TakeEffect: ICancellableEffect<ITakeEffectDescription, void> = {
	canResolveResult(result: IteratorResult<ITakeEffectDescription>): result is IteratorResult<ITakeEffectDescription> {
		return result.value && result.value.effectIdentifier === TakeEffectIdentifier;
	},
	run<T>(result: IteratorResult<ITakeEffectDescription<T>>, runData: IEffectRunData<T>) {
		if (!runData.taskInputStream) {
			throw new Error('Please provide input stream via options in order to use TakeEffect');
		}

		const { condition } = result.value;

		const unsubscribe = runData.taskInputStream.subscribe((data) => {
			let matches: boolean;
			try {
				matches = condition(data);
			} catch (e) {
				unsubscribe();
				runData.next(e);
				return;
			}
			
			if (matches) {
				unsubscribe();
				runData.next(null, data);
			}
		});

		return {
			cancel: unsubscribe
		};
	}
}
