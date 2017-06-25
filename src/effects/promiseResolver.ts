import { IEffect, ICallback, IResolverFactory } from '../core/types';
import { createResolverFactory } from '../core/util';

const isStandardEffect = true;

const test = (result: Promise<any>) => result instanceof Promise;

const create = <T>(): IEffect<Promise<T>, T> => {
	return {
		run(result: Promise<T>, next: ICallback<T>) {
			result.then(result => next(null, result), error => next(error));
		},
	};
};

export const promiseResolverFactory: IResolverFactory<Promise<any>, any> = createResolverFactory('promiseResolver', test, create, isStandardEffect);
