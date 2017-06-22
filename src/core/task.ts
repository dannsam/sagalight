import { isFunction } from './util';
import { IEffect, ILogger, ITask, ITaskOptions, ITaskStartInfo, SagaError, TaskState, IEffectRunData } from './types';

const TASK_CANCEL = {
	toString() {
		return '@@SagaLight/TASK_CANCEL';
	},
};

const STATE_NEW = 'new';
const STATE_RUNNING = 'running';
const STATE_BEING_CANCELLED = 'being_cancelled';
const STATE_CANCELLED = 'cancelled';
const STATE_COMPLETE = 'complete';
const STATE_FAILED = 'failed';

let taskId = 0;

export class Task<T = any> implements ITask {
	public state: TaskState = STATE_NEW;
	public isMainComplete = false;
	public isCancelledBeforeStart = false;

	private childTasks: ITask[] = [];
	private error: Error | null = null;
	private returnValue: T | null = null;
	private currentEffect: IEffect<any, any> | null = null;
	private taskId: string;

	private effectRunData: IEffectRunData<any>;

	constructor(
		name: string | undefined,
		private iterator: Iterator<T>,
		private options: ITaskOptions) {

		this.taskId = `${name}[${taskId++}]`;
		this.effectRunData = this.createEffectRunData(this);
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

	public put(input: any) {
		if (!this.options.input) {
			throw new Error('Please provide input stream via run options in order to use put()');
		}

		this.options.input.put(input);
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
				this.currentEffect = this.options.getEffect(result.value);

				if (this.currentEffect) {
					this.log('info', `${this.taskId} running effect '${this.currentEffect.name || 'unnamedEffect'}'`);
					this.currentEffect.run(result.value, this.effectRunData);
				} else {
					this.log('info', `${this.taskId} resolving without effect`);
					this.next(null, result.value);
				}

			} else {
				this.isMainComplete = true;
				this.returnValue = result.value;
				this.onComplete();
			}
		} catch (error) {
			// unhandled error
			// rejecting the task
			this.onError(error);
		}
	}

	scheduleChildTask = (startInfo: ITaskStartInfo<any>): ITask => {
		const childTask = new Task(
			startInfo.name,
			startInfo.iterator, {
				getEffect: this.options.getEffect,
				input: this.options.input,
				logger: this.options.logger,
				callback: (error) => {
					this.childTasks.splice(this.childTasks.indexOf(childTask), 1);

					if (error) {
						this.onError(error);
					} else {
						this.onComplete();
					}
				},
			});

		this.childTasks.push(childTask);

		// start task async
		Promise.resolve().then(() => {
			childTask.start();
		});

		return childTask;
	}

	private onError(error: SagaError) {
		// unhandled error in main
		// let's try cancelling all the child tasks

		if (error instanceof Error) {
			error.sagaStack = `at ${this.taskId} \n ${error.sagaStack || error.stack}`;
		}

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

			this.options.callback(this.error, this.returnValue);
		}
	}

	private validateState(...expectedStates: TaskState[]): void | never {
		if (expectedStates.indexOf(this.state) === -1) {
			throw new Error(`Unexpected task state. Current: '${this.state}', Expected: ${expectedStates.map(x => `'${x}'`).join()}.`);
		}
	}

	private transitionStateToFrom(newState: TaskState, ...expectedStates: TaskState[]): void | never {
		this.validateState(...expectedStates);

		this.log('info', `${this.taskId} ${this.state} -> ${newState}`);

		this.state = newState;
	}

	private cancelCurrentEffect() {
		const effect = this.currentEffect;
		if (effect) {
			this.currentEffect = null;

			try {
				if (effect.cancel) {
					effect.cancel();
				}
			} catch (error) {
				this.onError(error);
			}
		}
	}

	private cancelChildTasks() {
		this.childTasks.forEach(x => x.cancel());
	}

	private log: ILogger = (level, message, error) => {
		if (this.options.logger) {
			this.options.logger(level, message, error);
		}
	}

	private createEffectRunData(task: Task): IEffectRunData<any> {
		return {
			get taskId() {
				return task.taskId;
			},
			get next() {
				return task.next;
			},
			get isTaskCancelled() {
				return task.state === STATE_BEING_CANCELLED || task.state === STATE_CANCELLED;
			},
			get scheduleChildTask() {
				return task.scheduleChildTask;
			},
			get taskInputStream() {
				return task.options.input;
			},
			get getEffect() {
				return task.options.getEffect;
			},
			get logger() {
				return task.options.logger;
			},
		};
	}

}
