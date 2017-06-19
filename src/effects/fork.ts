export const ForkEffectIdentifier = {
	toString(): '@sagalight/effect/fork' {
		return '@sagalight/effect/fork';
	},
};

export interface IForkEffectDescription<T = any> {
	effectIdentifier: typeof ForkEffectIdentifier;
	factory: IIteratorFactory<T>;
	args: any[];
}

export function fork<T>(factory: IIteratorFactory<T>, ...args: any[]): IForkEffectDescription {
	return {
		factory,
		args,
		effectIdentifier: ForkEffectIdentifier,
	};
}

export const ForkEffect: IEffect<IForkEffectDescription, ITask> = {
	canResolveResult(result: IteratorResult<IForkEffectDescription>): result is IteratorResult<IForkEffectDescription> {
		return result.value && result.value.effectIdentifier === ForkEffectIdentifier;
	},
	run<T>(result: IteratorResult<IForkEffectDescription<T>>, runData: IEffectRunData<ITask>) {
		const { factory, args } = result.value;

		const iterator = factory(...args);

		const childTask = runData.scheduleChildTask({
			iterator,
			name: factory.name,
		});

		runData.next(null, childTask);
	},
};
