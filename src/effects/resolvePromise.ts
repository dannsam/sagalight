

export default class PromiseResolver implements IEffect {
	cancellable = false;

	canResolve<T>(result: IteratorResult<Promise<T>>): boolean {
		return result.value instanceof Promise;
	}
 
	resolve<T>(result: IteratorResult<Promise<T>>, cb: IEffectCallback<T>): void {
		result.value.then((result) => cb(null, result), (error) => cb(error));
	}
}
