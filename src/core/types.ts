
export type TaskState = 'new' | 'running' | 'cancelled' | 'complete' | 'failed' | 'being_cancelled';

export interface ITask {
	scheduleChildTask(child: ITaskStartInfo<any>): ITask;
	next: ICallback;
	readonly state: TaskState;
	cancel(): void;
}

export interface ICancellableEffectInfo {
	effectName?: string;
	cancel(): void;
}

export interface IEffect<TData = any, TOutput = any> {
	effectName: string;
	canResolve: (result: IteratorResult<TData>) => boolean;
	resolver: (result: IteratorResult<TData>, runData: IEffectRunData<TOutput>) => void | ICancellableEffectInfo;
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

export interface IIteratorFactory<T = any> {
	(...args: any[]): Iterator<T>;
	name?: string;
}

export type IEffectCollection = (IEffect)[];

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
	name?: string;
	iterator: Iterator<T>;
}
