export const TakeEffectIdentifier = {
	toString(): '@sagalight/effect/take' {
		return '@sagalight/effect/take';
	}
}

export interface ITakeEffectDescription<T = any> {
	effectIdentifier: typeof TakeEffectIdentifier;
	condition: (data: any) => boolean;
	stream?: IStream;
}

export function take<T>(condition: (data: T) => boolean, stream?: IStream): ITakeEffectDescription<T> {
	return {
		effectIdentifier: TakeEffectIdentifier,
		condition,
		stream
	};
}

export const TakeEffect: ICancellableEffect<ITakeEffectDescription, void> = {
	canResolveResult(result: IteratorResult<ITakeEffectDescription>): result is IteratorResult<ITakeEffectDescription> {
		return result.value && result.value.effectIdentifier === TakeEffectIdentifier;
	},
	run<T>(result: IteratorResult<ITakeEffectDescription<T>>, runData: IEffectRunData<T>) {
		const stream = result.value.stream || runData.taskInputStream;

		if (!stream) {
			throw new Error('Please provide input stream via run options or take(..., stream) in order to use TakeEffect');
		}

		const { condition } = result.value;

		const unsubscribe = stream.subscribe((data) => {
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
