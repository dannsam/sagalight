
import { IEffectFactoryCollection, IEffectFactory } from './types';

const standardEffects: IEffectFactoryCollection = [];

export function getStandardEffects(): IEffectFactoryCollection {
	return standardEffects;
}

export function registerStandardEffect(effect: IEffectFactory) {
	standardEffects.push(effect);
}
