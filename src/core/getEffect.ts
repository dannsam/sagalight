import { IEffectFactoryCollection, IEffect } from './types';

export function getEffect<TInput = any>(result: TInput,  effectFactories: IEffectFactoryCollection): IEffect<any, any> | null {
	for (let i = 0; i < effectFactories.length; i++) {
		const factory = effectFactories[i];
		if (factory.canResolve(result)) {
			return factory.create();
		}
	}

	return null;
}
