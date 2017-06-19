import { getEffect } from './getEffect';

const TASK_CANCEL = {
	toString() {
		return '@@sagalight/TASK_CANCEL'
	}
};

export class Task<T = any> implements ITask {
	private isStarted = false;
	public isCancelled = false;
	private isCompleted = false;
	private childTasks: ITask[] = [];
	private isSettling: boolean;
	private childPromises: Promise<any>[] = [];
	public done: Promise<any>;
	private resolve: Function;
	private reject: Function;
	private currentCancellableEffect: ICancellableEffectInfo | null | void = null;

	constructor(private name: string, private iterator: Iterator<T>, private effects: IEffectCollection, private parent: ITask | null = null) {
		this.done = new Promise((resolve, reject) => {
			this.resolve = resolve;
			this.reject = reject;
		});
	}

	public start() {
		if (this.isStarted) {
			throw new Error('Cannot start a running Task');
		}

		this.isStarted = true;
		//kicks up the generator
		this.next(null, null);
	}

	public cancel() {
		if (this.isCancelled || this.isCompleted) {
			//task is already complete or being cancelled - noop;
			return;
		}

		this.isCancelled = true;
		//cancel current effect
		if (this.currentCancellableEffect) {
			this.currentCancellableEffect.cancel((err) => {
				this.next(err, null);
			});
		}

		//cancel children
		this.childTasks.forEach(x => x.cancel());
	}

	next = (error: Error | null, input: any) => {
		if (!this.isStarted) {
			throw new Error('Cannot iterate a non-started task');
		}

		this.currentCancellableEffect = null;

		try {
			let result: IteratorResult<any>;
			if (error) {
				if (!isFunction(this.iterator.throw)) {
					//iterator does not support throw
					//rejecting the task
					this.reject(error);
					return;
				}

				result = this.iterator.throw(error);
			} else if (this.isCancelled && !this.isSettling) {
				if (isFunction(this.iterator.return)) {
					result = this.iterator.return(TASK_CANCEL);
				} else {
					result = {
						done: true,
						value: TASK_CANCEL
					};
				}
			} else {
				result = this.iterator.next(input);
			}

			if (!result.done) {
				if (this.isCancelled) {
					this.isSettling = true;
				}

				const effect = getEffect(result, this.effects);
				this.currentCancellableEffect = effect.run(result, { next: this.next, isTaskCancelled: this.isCancelled, scheduleChildTask: this.scheduleChildTask });
			} else {
				Promise.all(this.childPromises).then(() => this.resolve(result.value), err => this.reject(err)).then(x => {
					this.isCompleted = true;
				});
			}
		} catch (error) {
			//unhandled error
			//rejecting the task
			this.reject(error);
		}
	}

	scheduleChildTask = ({ name, iterator }: ITaskStartInfo<any>): ITask => {
		const childTask = new Task(name, iterator, this.effects, this);

		this.childTasks.push(childTask);

		this.childPromises.push(Promise.resolve().then(() => {
			//TODO start tracking rejections NOW!
			childTask.start();
			return childTask.done;
		}));

		return childTask;
	}
}

function isFunction(test: any): test is Function {
	return typeof test === 'function';
}