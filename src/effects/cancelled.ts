import { IEffect, IEffectRunData } from '../core/types';

export const CancelledEffectIdentifier = {
	toString(): '@sagalight/effect/cancelled' {
		return '@sagalight/effect/cancelled';
	},
};

export type ICancelledEffectIdentifier = typeof CancelledEffectIdentifier;

export function cancelled() {
	return CancelledEffectIdentifier;
}

export const CancelledEffect: IEffect<ICancelledEffectIdentifier, boolean> = {
	canResolveResult(result: IteratorResult<any>) {
		return result.value === CancelledEffectIdentifier;
	},
	run(_, runData: IEffectRunData<boolean>): void {
		runData.next(null, runData.isTaskCancelled);
	},
};
