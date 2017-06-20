import { IEffect, IEffectRunData } from '../core/types';
import { createResolver } from '../core/util';

const isStandardEffect = true;

const test = (result: IteratorResult<Promise<any>>) => result.value instanceof Promise;

const resolver = <T>(result: IteratorResult<Promise<T>>, runData: IEffectRunData<T>) => {
	result.value.then(result => runData.next(null, result), error => runData.next(error));
};

export const promiseResolver: IEffect<Promise<any>, any> = createResolver('promiseResolver', test, resolver, isStandardEffect);
