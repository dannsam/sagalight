declare interface IEffect {
	canResolve<TInput = any>(result: IteratorResult<TInput>): boolean;
	resolve<TInput = any, TOutput = any>(result: IteratorResult<TInput>, cb: IEffectCallback<TOutput>): void;
	cancellable: boolean;
}

declare interface IEffectCallback<TOutput = any> {
	(error: null | Error, result?: TOutput): void;
}