export const ForkEffectIdentifier = {
	toString(): '@sagalight/effect/fork' {
		return '@sagalight/effect/fork';
	}
}

export interface IForkEffectDescription<T = any> {
    effectIdentifier: typeof ForkEffectIdentifier;
    factory: IIteratorFactory<T>;
    args: any[];
}

export function fork<T>(factory: IIteratorFactory<T>, ...args: any[]): IForkEffectDescription {
    return {
        effectIdentifier: ForkEffectIdentifier,
        factory,
        args
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
            name: factory.name, 
            iterator
        });

        runData.next(null, childTask);
    }
}
