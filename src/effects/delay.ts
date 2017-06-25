import { createEffectFactory } from '../core/util';
import { IEffectSignature, ICallback, IEffectFactory } from '../core/types';

export interface IDelayEffectSignature extends IEffectSignature {
	args: [number];
}

const isStandardEffect = true;

export const delayEffectFactory: IEffectFactory<IDelayEffectSignature, null> = createEffectFactory('delay', () => {
	let timeout: number;

	return {
		run(result: IDelayEffectSignature, next: ICallback<null>) {
			const [delay] = result.args;

			timeout = setTimeout(
				() => {
					next(null, null);
				},
				delay);
		},
		cancel() {
			clearTimeout(timeout);
		},
	};
}, isStandardEffect);

export const delay: (delay: number) => IDelayEffectSignature = delayEffectFactory.signature as any;
