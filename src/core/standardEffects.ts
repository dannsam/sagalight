
import { IEffectFactoryCollection, IResolverFactory } from './types';

const standardEffects: IEffectFactoryCollection = [];

export function getStandardEffects(): IEffectFactoryCollection {
	return standardEffects;
}

export function registerStandardEffect(effect: IResolverFactory) {
	standardEffects.push(effect);
}
