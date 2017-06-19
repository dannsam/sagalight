export const ResolvePromiseEffect: IEffect<Promise<any>, any> = {
	canResolveResult(result: IteratorResult<Promise<any>>): result is IteratorResult<Promise<any>> {
		return result.value instanceof Promise;
	},
	run<T>(result: IteratorResult<Promise<T>>, runData: IEffectRunData<T>): void {
		result.value.then(result => runData.next(null, result), error => runData.next(error));
	},
};
