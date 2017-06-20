import { IEffect } from '../core/types';

export const StandardEffect: IEffect = {
	canResolveResult(_: IteratorResult<any>) {
		return true;
	},
	run(result, runData) {
		runData.next(null, result.value);
	},
};
