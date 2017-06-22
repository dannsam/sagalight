import { IEffectFactoryCollection, IEffect } from './types';

export function getEffect<TInput = any>(result: TInput, effects: IEffectFactoryCollection): IEffect<any, any> | null {
	for (let i = 0; i < effects.length; i++) {
		const e = effects[i];
		if (e.canResolve(result)) {
			return e.create();
		}
	}
	
	return null;
}
