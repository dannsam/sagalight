import { IEffect } from '../core/types';

export const StandardEffect: IEffect = {
	canResolveResult(result: IteratorResult<any>):result is IteratorResult<any> {
		return true;
	},
	run(result, runData) {
		runData.next(null, result.value);
	},
};
