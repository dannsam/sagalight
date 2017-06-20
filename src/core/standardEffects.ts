
import { IEffectCollection, IEffect } from './types';

const standardEffects: IEffectCollection = [];

export function getStandardEffects(): IEffectCollection {
	return standardEffects;
}

export function registerStandardEffect(effect: IEffect) {
	standardEffects.push(effect);
}
