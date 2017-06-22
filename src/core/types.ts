
export type TaskState = 'new' | 'running' | 'cancelled' | 'complete' | 'failed' | 'being_cancelled';

export type SagaError = Error & { sagaStack?: string };

export interface ITask {
	scheduleChildTask(child: ITaskStartInfo<any>): ITask;
	next: ICallback;
	readonly state: TaskState;
	cancel(): void;
}

export type IResolverFactory<TData = any, TOutput = any> = {
	effectName: string;
	canResolve: (result: IteratorResult<TData>) => boolean;
	create(): IEffect<TData, TOutput>;
};

export type IEffectFactory<TDataFunction = any, TData = any, TOutput= any> = IResolverFactory<TData, TOutput> & TDataFunction;

export type IEffectFactoryCollection = IResolverFactory[];

export interface IEffect<TData, TOutput> {
	name?: string;
	run(result: IteratorResult<TData>, runData: IEffectRunData<TOutput>): void;
	cancel?: () => void;
}

export interface IEffectRunData<TOutput = any> {
	next: ICallback<TOutput>;
	taskId: string;
	isTaskCancelled: boolean;
	scheduleChildTask(taskInfo: ITaskStartInfo<any>): ITask;
	taskInputStream: IStream | undefined;
}

export interface ICallback<T = any> {
	(error: null | SagaError, result?: T): void;
}

export interface IIteratorFactory<T = any> {
	(...args: any[]): Iterator<T>;
	name?: string;
}

export type IInputStreamFunction = (input: any) => void;
export type IUnsubscribeFunction = () => void;
export type ISubscribeFunction = (cb: IInputStreamFunction) => IUnsubscribeFunction;


export interface IStream {
	subscribe: ISubscribeFunction;
	put: IInputStreamFunction;
}

export interface IRunOptions {
	effects?: IEffectFactoryCollection;
	input?: IStream;
	debug?: boolean;
	callback?: ICallback;
}

export interface ITaskOptions {
	input?: IStream;
	logger: ILogger | null;
	callback: ICallback;
	getEffect: (result: IteratorResult<any>) => IEffect<any, any> | null;
}

export type LoggerLevel = 'info' | 'warn' | 'error';

export interface ILogger {
	(level: LoggerLevel, message: string, error?: string | Error): void;
}

export interface ITaskStartInfo<T> {
	name?: string;
	iterator: Iterator<T>;
}
