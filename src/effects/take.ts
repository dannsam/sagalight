import { IStream, IEffectContext, IEffectSignature, ICallback, IEffectFactory } from '../core/types';
import { createEffectFactory } from '../core/util';

export interface ITakeEffectSignature extends IEffectSignature {
	args: [(data: any) => boolean, IStream | null];
}

const isStandardEffect = true;

export const takeEffectFactory: IEffectFactory<ITakeEffectSignature, any> = createEffectFactory('take', () => {
	let unsubscribe: Function;

	return {
		run(result: ITakeEffectSignature, next: ICallback<any>, effectContext: IEffectContext) {
			const [condition, stream = effectContext.taskInputStream] = result.args;

			if (!stream) {
				throw new Error('Please provide input stream via run options or take(..., stream) in order to use TakeEffect');
			}
			unsubscribe = stream.subscribe((data) => {
				let matches: boolean;
				try {
					matches = condition(data);
				} catch (e) {
					unsubscribe();
					next(e);
					return;
				}

				if (matches) {
					unsubscribe();
					next(null, data);
				}
			});
		},
		cancel() {
			if (unsubscribe) {
				unsubscribe();
			}
		},
	};
}, isStandardEffect);

export const take: (condition: (data: any) => boolean, stream?: IStream) => ITakeEffectSignature = takeEffectFactory.signature as any;
