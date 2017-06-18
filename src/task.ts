import { runEffect } from './runEffect';


export class Task<T = any> {
	private isRunning = false;
	private isCancelled = false;

	constructor(private name: string, private iterator: Iterator<T>, private parent: Task | null = null) {
	}

	public start() {
		this.isRunning = true;
		//kicks up the generator
		this.next(null, null);
	}

	public cancel() {
		this.isCancelled = true;
	}

	private next = (error: Error | null, input: any) => {

		// if (!this.isRunning) {
		// 	throw new Error('Trying to resume an already finished generator');
		// }

		try {
			let result: IteratorResult<any>;
			if (error) {
				if (!this.iterator.throw) {
					throw Error('TODO bubble up ?')
				}

				result = this.iterator.throw(error);
			} else {
				result = this.iterator.next(input);
			}

			if (!result.done) {
				runEffect(result, this.next);
			} else {
				this.isRunning = false;
			}
		} catch (error) {
			console.error(error);
		}

	}
}
