export const CancelledEffectIdentifier = {
	toString(): '@sagalight/effect/cancelled' {
		return '@sagalight/effect/cancelled';
	}
}

export type ICancelledEffectIdentifier = typeof CancelledEffectIdentifier;

export function cancelled<T>() {
	return CancelledEffectIdentifier;
}

export const CancelledEffect: IEffect<ICancelledEffectIdentifier, boolean> = {
	canResolveResult(result: IteratorResult<any>): result is IteratorResult<ICancelledEffectIdentifier> {
		return result.value === CancelledEffectIdentifier;
	},
	run(result, runData: IEffectRunData<boolean>): void {
		runData.next(null, runData.isTaskCancelled);
	}
};
