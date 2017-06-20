
import { IInputStreamFunction, IStream, IUnsubscribeFunction } from './types';

export class Stream implements IStream {
	private subscriptions: IInputStreamFunction[] = [];

	subscribe(cb: IInputStreamFunction): IUnsubscribeFunction {
		this.subscriptions.push(cb);

		return () => {
			const index = this.subscriptions.indexOf(cb);
			if (index !== -1) {
				this.subscriptions.splice(index, 1);
			}
		};
	}

	put(data: any) {
		this.subscriptions.forEach((cb) => {
			cb(data);
		});
	}
}
