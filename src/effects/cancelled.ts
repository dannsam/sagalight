import { ICallback, IEffectSignature, IEffectContext, IEffectFactory } from '../core/types';
import { createEffectFactory } from '../core/util';

const isStandardEffect = true;

export interface ICancelledEffectSignature extends IEffectSignature { }

export const cancelledEffectFactory: IEffectFactory<ICancelledEffectSignature, boolean> = createEffectFactory('cancelled', () => {
	return {
		run(_: ICancelledEffectSignature, next: ICallback<boolean>, effectContext: IEffectContext) {
			next(null, effectContext.isTaskCancelled());
		},
	};
}, isStandardEffect);

export const cancelled: () => ICancelledEffectSignature = cancelledEffectFactory.signature;
