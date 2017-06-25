import { IEffect, IEffectContext, IEffectFactory, IEffectSignature, ICallback } from '../core/types';
import { createEffectFactory, runEffect, cancelEffect } from '../core/util';

export interface IRaceEffectSignature extends IEffectSignature {
	args: [{ [key: string]: any }];
}

const isStandardEffect = true;

export const raceEffectFactory: IEffectFactory<IRaceEffectSignature, { [key: string]: any }> = createEffectFactory('race', () => {
	let done = false;
	let keys: string[];
	let effects: { [key: string]: IEffect<any, any> };

	return {
		run(result: IRaceEffectSignature, next: ICallback<{ [key: string]: any }>, effectContext: IEffectContext) {
			// run(result: IWrappedEffectData < IRaceEffectData >, runData: IEffectContext<any>) {
			if (done) {
				// already cancelled
				return;
			}

			const [data] = result.args;

			keys = Object.keys(data);

			effects = keys.reduce((acc: any, item) => {
				const effect = effectContext.getEffect(data[item]);
				acc[item] = effect;
				return acc;
			}, {});

			// run all
			keys.forEach((k) => {
				const effect = effects[k];

				const wrappedNext = (err: any, r: any) => {
					if (done) {
						return;
					}

					done = true;

					// try to cancel all others
					keys.forEach((n) => {
						if (k !== n) {
							cancelEffect(effects[n]);
						}
					});

					// wrap result but don't wrap error
					next(err, { [k]: r });
				};

				runEffect(effect, data[k], wrappedNext, effectContext);
			});
		},
		cancel() {
			// set done and cancel all
			if (!done) {
				done = true;

				if (keys) {
					keys.forEach(k => cancelEffect(effects[k]));
				}
			}
		},
	};
}, isStandardEffect);

export const race: (effects: { [key: string]: any }) => IRaceEffectSignature = raceEffectFactory.signature as any;
