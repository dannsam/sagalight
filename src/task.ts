import { getEffect } from './getEffect';
import { isFunction } from './util';

const TASK_CANCEL = {
	toString() {
		return '@@sagalight/TASK_CANCEL';
	},
};

export const STATE_NEW = 'new';
export const STATE_RUNNING = 'running';
export const STATE_BEING_CANCELLED = 'being_cancelled';
export const STATE_CANCELLED = 'cancelled';
export const STATE_COMPLETE = 'complete';
export const STATE_FAILED = 'failed';

export class Task<T = any> implements ITask {
	public state: TaskState = STATE_NEW;
	public isMainComplete = false;
	public isCancelledBeforeStart = false;

	private childTasks: ITask[] = [];
	private isSettling: boolean;
	private error: Error | null = null;
	private currentCancellableEffect: ICancellableEffectInfo | null | void = null;

	constructor(
		private name: string,
		private iterator: Iterator<T>,
		private options: ITaskOptions,
		private parent?: ITask | undefined) {

	}

	public start() {
		this.transitionStateToFrom(STATE_RUNNING, STATE_NEW);

		// kicks up the generator
		// properly cancel the task even though it hasn't yet started
		this.next(null, this.isCancelledBeforeStart ? TASK_CANCEL : null);
	}

	public cancel() {
		if (this.state === STATE_RUNNING) {
			this.next(null, TASK_CANCEL);
		} else if (this.state === STATE_NEW) {
			this.isCancelledBeforeStart = true;
		}
	}

	next = (error: Error | null, input: any) => {
		this.validateState(STATE_RUNNING, STATE_BEING_CANCELLED);

		try {
			let result: IteratorResult<any>;
			if (error) {
				if (!isFunction(this.iterator.throw)) {
					// iterator does not support throw
					// rejecting the task
					this.onError(error);
					return;
				}

				result = this.iterator.throw(error);
			} else if (input === TASK_CANCEL) {
				this.transitionStateToFrom(STATE_BEING_CANCELLED, STATE_RUNNING);

				this.cancelChildTasks();
				this.cancelCurrentEffect();

				if (isFunction(this.iterator.return)) {
					result = this.iterator.return(TASK_CANCEL);
				} else {
					result = { done: true, value: TASK_CANCEL };
				}
			} else {
				result = this.iterator.next(input);
			}

			if (!result.done) {
				const effect = getEffect(result, this.options.effects);
				this.currentCancellableEffect = effect.run(result, {
					next: this.next,
					taskState: this.state,
					scheduleChildTask: this.scheduleChildTask,
					taskInputStream: this.options.input,
				});
			} else {
				this.isMainComplete = true;
				this.onComplete();
			}
		} catch (error) {
			// unhandled error
			// rejecting the task
			this.onError(error);
		}
	}

	scheduleChildTask = ({ name, iterator }: ITaskStartInfo<any>): ITask => {
		const childTask = new Task(
			name,
			iterator, {
				effects: this.options.effects,
				input: this.options.input,
				callback: (error, result) => {
					this.childTasks.splice(this.childTasks.indexOf(childTask), 1);

					if (error) {
						// unhandled rejection in child task
						// stopping and failing the current task
						this.error = error;
						this.cancel();
					}

					this.onComplete();
				},
			},
			this);

		this.childTasks.push(childTask);

		// start task async
		Promise.resolve().then(() => {
			childTask.start();
		});

		return childTask;
	}

	private onError(error: Error) {
		// unhandled error in main
		// let's try cancelling all the child tasks
		this.error = error;
		this.isMainComplete = true;

		this.cancelChildTasks();
		this.onComplete();
	}

	private onComplete() {
		if (this.childTasks.length === 0 && this.isMainComplete) {
			if (this.error) {
				this.transitionStateToFrom(STATE_FAILED, STATE_FAILED, STATE_RUNNING, STATE_BEING_CANCELLED);
			} else if (this.state === STATE_BEING_CANCELLED) {
				this.transitionStateToFrom(STATE_CANCELLED, STATE_BEING_CANCELLED);
			} else {
				this.transitionStateToFrom(STATE_COMPLETE, STATE_RUNNING);
			}

			try {
				this.options.callback(this.error);
			} catch (error) {
				// task is complete but there was a problem running the callback
				this.options.callback(error);
			}
		}
	}

	private validateState(...expectedStates: TaskState[]): void | never {
		if (expectedStates.indexOf(this.state) === -1) {
			throw new Error(`Unexpected task state. Current: '${this.state}', Expected: ${expectedStates.map(x => `'${x}'`).join()}.`);
		}
	}

	private transitionStateToFrom(newState: TaskState, ...expectedStates: TaskState[]): void | never {
		this.validateState(...expectedStates);
		this.state = newState;
	}

	private cancelCurrentEffect() {
		const effect = this.currentCancellableEffect;
		if (effect) {
			this.currentCancellableEffect = null;

			try {
				effect.cancel();
			} catch (error) {
				this.onError(error);
			}
		}
	}

	private cancelChildTasks() {
		this.childTasks.forEach(x => x.cancel());
	}
}
