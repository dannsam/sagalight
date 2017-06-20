
export type TaskState = 'new' | 'running' | 'cancelled' | 'complete' | 'failed' | 'being_cancelled';

export interface ITask {
	scheduleChildTask(child: ITaskStartInfo<any>): ITask;
	next: ICallback;
	readonly state: TaskState;
	cancel(): void;
}

export interface IEffectResolver<TInput> {
	canResolveResult(result: IteratorResult<TInput>): boolean;
}

export interface IEffect<TInput = any, TOutput= any> extends IEffectResolver<TInput> {
	run(result: IteratorResult<TInput>, runData: IEffectRunData<TOutput>): void;
}

export interface ICancellableEffect<TInput= any, TOutput= any> extends IEffectResolver<TInput> {
	run(result: IteratorResult<TInput>, runData: IEffectRunData<TOutput>): ICancellableEffectInfo;
}

export interface ICancellableEffectInfo {
	cancel(): void;
}

export interface ICallback<T = any> {
	(error: null | Error, result?: T): void;
}

export interface IEffectRunData<TOutput = any> {
	next: ICallback<TOutput>;
	isTaskCancelled: boolean;
	scheduleChildTask(taskInfo: ITaskStartInfo<any>): ITask;
	taskInputStream: IStream | undefined;
}

export interface IIteratorFactory<T> {
	(...args: any[]): IterableIterator<T>;
	name: string;
}

export type IEffectCollection = (IEffect | ICancellableEffect)[];

export type IInputStreamFunction = (input: any) => void;
export type IUnsubscribeFunction = () => void;
export type ISubscribeFunction = (cb: IInputStreamFunction) => IUnsubscribeFunction;


export interface IStream {
	subscribe: ISubscribeFunction;
	put: IInputStreamFunction;
}

export interface IRunOptions {
	effects?: IEffectCollection;
	input?: IStream;
	callback?: ICallback;
}

export interface ITaskOptions {
	effects: IEffectCollection;
	input?: IStream;
	callback: ICallback;
}

export interface ITaskStartInfo<T> {
	name: string;
	iterator: Iterator<T>;
}
