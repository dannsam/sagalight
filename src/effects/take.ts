import { IStream, IEffectRunData, IEffect } from '../core/types';
import { createEffectFactory } from '../core/util';

export interface ITakeEffectData {
	condition: (data: any) => boolean;
	stream?: IStream;
}

const isStandardEffect = true;

const dataFn = (condition: (data: any) => boolean, stream?: IStream) => ({ condition, stream });

const createEffectRun = <T>(): IEffect<ITakeEffectData, T> => {
	let unsubscribe: Function;

	return {
		run(result: IteratorResult<ITakeEffectData>, runData: IEffectRunData<T>) {
			const stream = result.value.stream || runData.taskInputStream;

			if (!stream) {
				throw new Error('Please provide input stream via run options or take(..., stream) in order to use TakeEffect');
			}

			const condition = result.value.condition;

			unsubscribe = stream.subscribe((data) => {
				let matches: boolean;
				try {
					matches = condition(data);
				} catch (e) {
					unsubscribe();
					runData.next(e);
					return;
				}

				if (matches) {
					unsubscribe();
					runData.next(null, data);
				}
			});
		},
		cancel() {
			if (unsubscribe) {
				unsubscribe();
			}
		},
	};
};

export const take = createEffectFactory('take', dataFn, createEffectRun, isStandardEffect);
