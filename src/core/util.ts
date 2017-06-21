import { registerStandardEffect } from './standardEffects';
import { IEffectFactory, IEffect, IResolverFactory } from './types';

export function isFunction(test: any): test is Function {
	return typeof test === 'function';
}

const effectIdentifierKey = '@saga-core/effect';

export function createEffectFactory<TDataFunction extends (...args: any[]) => TData, TData, TOutput>(
	effectName: string,
	dataFn: TDataFunction,
	create: () => IEffect<TData, TOutput>,
	isStandard: boolean = false,
): IEffectFactory<TDataFunction, TData, TOutput> {

	const effect = ((...args: any[]) => {
		const data: any = dataFn(...args);
		data[effectIdentifierKey] = effectName;
		return data;
	}) as IEffectFactory<TDataFunction, TData, TOutput>;

	return createFactory(
		effect,
		effectName,
		/* test */
		(result: any): boolean => result.value[effectIdentifierKey] === effectName,
		create,
		isStandard);
}

export function createResolverFactory<TData, TOutput>(
	effectName: string,
	test: (result: IteratorResult<TData>) => boolean,
	create: () => IEffect<TData, TOutput>,
	isStandard: boolean = false,
): IResolverFactory<TData, TOutput> {
	return createFactory({}, effectName, test, create, isStandard);
}

function createFactory<TDataFunction, TData, TOutput>(
	target: TDataFunction & Partial<IResolverFactory<TData, TOutput>>,
	effectName: string,
	test: (result: IteratorResult<TData>) => boolean,
	create: () => IEffect<TData, TOutput>,
	isStandard: boolean) {

	target.effectName = effectName;
	target.create = ensureCreateHasEffectName(effectName, create);
	target.canResolve = test;

	if (isStandard) {
		registerStandardEffect(target);
	}

	return target as TDataFunction & IResolverFactory<TData, TOutput>;
}

function ensureCreateHasEffectName<TData, TOutput>(
	name: string,
	create: () => IEffect<TData, TOutput>) {
	return () => {
		const effectInfo = create();
		effectInfo.name = name;
		return effectInfo;
	};
}

export function log(level: 'info' | 'warn' | 'error', message: string, error: string | Error = '') {
	if (typeof window === 'undefined') {
		const stack = error instanceof Error ? error.stack : error;
		console.log(`saga-core ${level}: ${message}\n${stack}`);
	} else {
		console[level](message, error);
	}
}
