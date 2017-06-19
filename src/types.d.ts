declare interface IEffectResolver<TInput> {
	canResolveResult(result: IteratorResult<TInput>): result is IteratorResult<TInput>;
}

declare type TaskState = 'new' | 'running' | 'cancelled' | 'complete' | 'failed' | 'being_cancelled';

declare interface ITask {
	scheduleChildTask(child: ITaskStartInfo<any>): ITask;
	next: ICallback;
	readonly state: TaskState;
	cancel(): void;
}

declare interface IEffect<TInput = any, TOutput= any> extends IEffectResolver<TInput> {
	run(result: IteratorResult<TInput>, runData: IEffectRunData<TOutput>): void;
}

declare interface ICancellableEffect<TInput= any, TOutput= any> extends IEffectResolver<TInput> {
	run(result: IteratorResult<TInput>, runData: IEffectRunData<TOutput>): ICancellableEffectInfo;
}

declare interface ICancellableEffectInfo {
	cancel(): void;
}

declare interface ICallback<T = any> {
	(error: null | Error, result?: T): void;
}

declare interface IEffectRunData<TOutput = any> {
	next: ICallback<TOutput>;
	taskState: TaskState;
	scheduleChildTask(taskInfo: ITaskStartInfo<any>): ITask;
	taskInputStream: IStream | undefined;
}

declare interface IIteratorFactory<T> {
	(...args: any[]): IterableIterator<T>;
	name: string;
}

declare type IEffectCollection = (IEffect | ICancellableEffect)[];

declare type IInputStreamFunction = (input: any) => void;
declare type IUnsubscribeFunction = () => void;
declare type ISubscribeFunction = (cb: IInputStreamFunction) => IUnsubscribeFunction;


declare interface IStream {
	subscribe: ISubscribeFunction;
	put: IInputStreamFunction;
}

declare interface IRunOptions {
	effects?: IEffectCollection;
	input?: IStream;
	callback?: ICallback;
}

declare interface ITaskOptions {
	effects: IEffectCollection;
	input?: IStream;
	callback: ICallback;
}

declare interface ITaskStartInfo<T> {
	name: string;
	iterator: Iterator<T>;
}
