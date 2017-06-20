
import { IEffectRunData, IEffect, ICancellableEffectInfo } from './types';
import { registerStandardEffect } from './standardEffects';

export function isFunction(test: any): test is Function {
	return typeof test === 'function';
}

const effectIdentifierKey = '@saga-core/effect';

export function createEffectIdentifier(effectName: string) {
	return {
		[effectIdentifierKey]: effectName,
	};
}

export function createEffect<TDataFunction extends (...args: any[]) => TData, TData, TOutput>(
	effectName: string,
	dataFn: TDataFunction,
	resolver: (result: IteratorResult<TData>, runData: IEffectRunData<TOutput>) => void | ICancellableEffectInfo,
	isStandard?: boolean,
): TDataFunction & IEffect<TData, TOutput> {

	const effect = ((...args: any[]) => {
		const data: any = dataFn(...args);
		data[effectIdentifierKey] = effectName;
		return data;
	}) as TDataFunction & IEffect<TData, TOutput>;

	effect.effectName = effectName;
	effect.resolver = ensureResolverCancelInfoContainsName(effectName, resolver);

	effect.canResolve = (result: any): boolean => {
		return result.value[effectIdentifierKey] === effectName;
	};

	if (isStandard) {
		registerStandardEffect(effect);
	}

	return effect;
}

export function createResolver<TData, TOutput>(
	effectName: string,
	test: (result: IteratorResult<TData>) => boolean,
	resolver: (result: IteratorResult<TData>, runData: IEffectRunData<TOutput>) => void | ICancellableEffectInfo,
	isStandard?: boolean,
): IEffect<TData, TOutput> {

	const effect: IEffect<TData, TOutput> = {
		effectName,
		resolver: ensureResolverCancelInfoContainsName(effectName, resolver),
		canResolve: test,
	};

	if (isStandard) {
		registerStandardEffect(effect);
	}

	return effect;
}

function ensureResolverCancelInfoContainsName<TData, TOutput>(
	name: string,
	resolver: (result: IteratorResult<TData>, runData: IEffectRunData<TOutput>) => void | ICancellableEffectInfo) {
	return (result: IteratorResult<TData>, runData: IEffectRunData<TOutput>) => {
		const cancelInfo = resolver(result, runData);
		if (cancelInfo) {
			cancelInfo.effectName = name;
		}
		return cancelInfo;
	};
}
