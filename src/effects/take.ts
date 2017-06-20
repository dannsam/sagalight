import { IStream, IEffectRunData, IEffect } from '../core/types';
import { createEffect } from '../core/util';

export interface ITakeEffectData {
	condition: (data: any) => boolean;
	stream?: IStream;
}

export interface ITakeEffect<T = any> extends IEffect<ITakeEffectData, T> {
	(condition: (data: any) => boolean, stream?: IStream): ITakeEffectData;
}

const isStandardEffect = true;

const dataFn = (condition: (data: any) => boolean, stream?: IStream) => ({ condition, stream });

const resolver = <T>(result: IteratorResult<ITakeEffectData>, runData: IEffectRunData<T>) => {
	const stream = result.value.stream || runData.taskInputStream;

	if (!stream) {
		throw new Error('Please provide input stream via run options or take(..., stream) in order to use TakeEffect');
	}

	const condition = result.value.condition;

	const unsubscribe = stream.subscribe((data) => {
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

	return {
		cancel: unsubscribe,
	};
};

export const take: ITakeEffect = createEffect('take', dataFn, resolver, isStandardEffect);
