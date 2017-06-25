import { ITask, IEffectContext,IEffectSignature, CallFunction, NamedFunction, ICallback, IEffectFactory } from '../core/types';
import { createEffectFactory } from '../core/util';

const isStandardEffect = true;

export type ForkEffectArguments =
	[NamedFunction] |
	[NamedFunction, any] |
	[NamedFunction, any, any] |
	[NamedFunction, any, any, any] |
	[NamedFunction, any, any, any, any] |
	[NamedFunction, any, any, any, any, any];

export interface IForkEffectSignature extends IEffectSignature { 
	args: ForkEffectArguments;
}

export const forkEffectFactory: IEffectFactory<IForkEffectSignature, ITask> = createEffectFactory('fork', () => {
	return {
		run(result: IForkEffectSignature, next: ICallback<ITask>, effectContext: IEffectContext) {
			const [fn, ...args] = result.args;

			const iterator = fn(...args);

			const childTask = effectContext.scheduleChildTask({
				iterator,
				name: fn.name,
			});

			next(null, childTask);
		},
	};
}, isStandardEffect);

export const fork: CallFunction<IForkEffectSignature> = forkEffectFactory.signature as any;

