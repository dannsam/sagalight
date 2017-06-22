import { IEffect, IEffectRunData } from '../core/types';
import { createResolverFactory } from '../core/util';

const isStandardEffect = true;

const test = (result: Promise<any>) => result instanceof Promise;

const create = <T>(): IEffect<Promise<T>, T> => {
	return {
		run(result: Promise<T>, runData: IEffectRunData<T>) {
			result.then(result => runData.next(null, result), error => runData.next(error));
		},
	};
};

export const promiseResolver = createResolverFactory('promiseResolver', test, create, isStandardEffect);
