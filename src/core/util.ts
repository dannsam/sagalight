import { registerStandardEffect } from './standardEffects';
import { IEffect, IEffectFactory, IResolverFactory, LoggerLevel, IWrappedEffectData } from './types';

export function isFunction(test: any): test is Function {
	return typeof test === 'function';
}

const effectIdentifierKey = '@SagaLight/effect';

export function createEffectFactory<TDataFunction extends (...args: any[]) => TData, TData, TOutput>(
	effectName: string,
	dataFn: TDataFunction,
	create: () => IEffect<IWrappedEffectData<TData>, TOutput>,
	isStandard: boolean = false,
): IEffectFactory<TDataFunction, TData, TOutput> {

	const effect = ((...args: any[]) => {
		return {
			[effectIdentifierKey]: effectName,
			data: dataFn(...args),
		} as any;
	}) as TDataFunction;

	return createFactory(
		effect,
		effectName,
		/* test */
		(result: any): boolean => result[effectIdentifierKey] === effectName,
		create,
		isStandard);
}

export function createResolverFactory<TData, TOutput>(
	effectName: string,
	test: (result: TData) => boolean,
	create: () => IEffect<TData, TOutput>,
	isStandard: boolean = false,
): IResolverFactory<TData, TOutput> {
	return createFactory({}, effectName, test, create, isStandard);
}

function createFactory<TDataFunction, TData, TOutput>(
	target: TDataFunction & Partial<IResolverFactory<TData, TOutput>>,
	effectName: string,
	test: (result: TData) => boolean,
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

export function createLogger(...levels: LoggerLevel[]) {
	return (level: LoggerLevel, message: string, error: string | Error = '') => {
		if (levels.indexOf(level) === -1) {
			return;
		}

		if (typeof window === 'undefined') {
			const stack = error instanceof Error ? error.stack : error;
			console.log(`SagaLight ${level}: ${message}\n${stack}`);
		} else {
			console[level](message, error);
		}
	};
}
