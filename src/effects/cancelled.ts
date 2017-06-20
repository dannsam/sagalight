import { IEffect, IEffectRunData } from '../core/types';
import { createEffect } from '../core/util';

export interface ICancelledEffectData { }

export interface ICancelledEffect extends IEffect<ICancelledEffectData, boolean> {
	(): ICancelledEffectData;
}

const isStandardEffect = true;

const dataFn = () => ({});

const resolver = (_: IteratorResult<ICancelledEffectData>, runData: IEffectRunData<boolean>) => {
	runData.next(null, runData.isTaskCancelled);
};

export const cancelled: ICancelledEffect = createEffect('cancelled', dataFn, resolver, isStandardEffect);
