import { ITask, IEffect, IEffectRunData, IWrappedEffectData } from '../core/types';
import { createEffectFactory, isFunction } from '../core/util';

export interface IRaceEffectData {
	[key: string]: any;
}

const isStandardEffect = true;

const dataFn = (effects: IRaceEffectData): IRaceEffectData => effects;

const create = (): IEffect<IWrappedEffectData<IRaceEffectData>, ITask> => {
	let done = false;
	let keys: string[];
	let effects: { [key: string]: IEffect<any, any> };

	return {
		run(result: IWrappedEffectData<IRaceEffectData>, runData: IEffectRunData<any>) {
			if (done) {
				// already cancelled
				return;
			}
			const { data } = result;

			keys = Object.keys(data);

			effects = keys.reduce((acc: any, item) => {
				const effect = runData.getEffect(data[item]);
				acc[item] = effect;
				return acc;
			}, {});

			// run all
			keys.forEach((k) => {
				const effect = effects[k];

				const wrappedRunData = {
					...runData, next: (err: any, r: any) => {
						if (done) {
							return;
						}

						done = true;

						// try to cancel all others
						keys.forEach((n) => {
							const toCancel = effects[n];
							if (k !== n && toCancel && isFunction(toCancel.cancel)) {
								toCancel.cancel();
							}
						});

						// wrap result but don't wrap error
						runData.next(err, { [k]: r });
					},
				};

				if (effect === null) {
					// resolve as is
					wrappedRunData.next(null, data[k]);
				} else {
					effect.run(data[k], wrappedRunData);
				}
			});
		},
		cancel() {
			// set done and cancel all
			if (!done) {
				done = true;

				if (keys) {
					keys.forEach((k) => {
						const toCancel = effects[k];
						if (toCancel && isFunction(toCancel.cancel)) {
							toCancel.cancel();
						}
					});
				}
			}
		},
	};
};

export const race = createEffectFactory('race', dataFn, create, isStandardEffect);
