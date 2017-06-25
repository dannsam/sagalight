import { IEffectContext, IEffectSignature, CallFunction, IEffectFactory, ICallback, NamedFunction } from '../core/types';
import { createEffectFactory, isIterator } from '../core/util';
import { Task } from '../core/task';

const isStandardEffect = true;

export type CallEffectArguments =
	[NamedFunction] |
	[NamedFunction, any] |
	[NamedFunction, any, any] |
	[NamedFunction, any, any, any] |
	[NamedFunction, any, any, any, any] |
	[NamedFunction, any, any, any, any, any];

export interface ICallEffectSignature extends IEffectSignature {
	args: CallEffectArguments;
}

export const callEffectFactory: IEffectFactory<ICallEffectSignature, any> = createEffectFactory('call', () => {
	let task: Task;

	return {
		run(result: ICallEffectSignature, next: ICallback<any>, effectContext: IEffectContext) {
			const [fn, ...args] = result.args;
			let callResult;

			try {
				callResult = fn(...args);
			} catch (error) {
				next(error);
				return;
			}

			if (isIterator(callResult)) {
				task = new Task(
					fn.name || `${effectContext.taskId}-iterator`,
					callResult, {
						callback: next,
						getEffect: effectContext.getEffect,
						input: effectContext.taskInputStream,
						logger: effectContext.logger,
					},
				);

				task.start();
			} else {
				next(null, callResult);
			}
		},
		cancel() {
			if (task) {
				task.cancel();
			}
		},
	};
}, isStandardEffect);

export const call: CallFunction<ICallEffectSignature> = callEffectFactory.signature as any;
