
export type TaskState = 'new' | 'running' | 'cancelled' | 'complete' | 'failed' | 'being_cancelled';

export type SagaError = Error & { sagaStack?: string };

export interface ITask {
	scheduleChildTask(child: ITaskStartInfo<any>): ITask;
	next: ICallback;
	readonly state: TaskState;
	cancel(): void;
}

export interface IResolverFactory<TData = any, TOutput = any> {
	effectName: string;
	canResolve: (result: TData) => boolean;
	create(): IEffect<TData, TOutput>;
}

export interface IEffectFactory<TData = any, TOutput = any> extends IResolverFactory<TData, TOutput> {
	signature(...args: any[]): IEffectSignature;
}

export type IEffectFactoryCollection = IResolverFactory[];

export interface IEffect<TData, TOutput> {
	name?: string;
	run(result: TData, next: ICallback<TOutput>, effectContext: IEffectContext): void;
	cancel?: () => void;
}

export interface IEffectSignature {
	args: any[];
}

export interface IEffectContext {
	readonly taskId: string;
	readonly taskInputStream: IStream | undefined;
	readonly logger: ILogger | null;
	isTaskCancelled(): boolean;
	scheduleChildTask(taskInfo: ITaskStartInfo<any>): ITask;
	getEffect: (result: any) => IEffect<any, any> | null;
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
	getEffect: (result: any) => IEffect<any, any> | null;
}

export type LoggerLevel = 'info' | 'warn' | 'error';

export interface ILogger {
	(level: LoggerLevel, message: string, error?: string | Error): void;
}

export interface ITaskStartInfo<T> {
	name?: string;
	iterator: Iterator<T>;
}

export type NamedFunction = Function & { name?: string };

export type Callable<T extends NamedFunction> = T;

export type Func0<T> = () => T;
export type Func1<T, T1> = (arg1: T1) => T;
export type Func2<T, T1, T2> = (arg1: T1, arg2: T2) => T;
export type Func3<T, T1, T2, T3> = (arg1: T1, arg2: T2, arg3: T3) => T;
export type Func4<T, T1, T2, T3, T4> = (arg1: T1, arg2: T2, arg3: T3, arg4: T4) => T;
export type Func5<T, T1, T2, T3, T4, T5> = (arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5) => T;
export type Func6<T, T1, T2, T3, T4, T5, T6> = (arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5, arg6: T6, ...rest: any[]) => T;


export type CallFunction<T> = {
	(fn: Callable<Func0<any>>): T;
	<T1>(fn: Callable<Func1<any, T1>>, arg1: T1): T;
	<T1, T2>(fn: Callable<Func2<any, T1, T2>>, arg1: T1, arg2: T2): T;
	<T1, T2, T3>(fn: Callable<Func3<any, T1, T2, T3>>, arg1: T1, arg2: T2, arg3: T3): T;
	<T1, T2, T3, T4>(fn: Callable<Func4<any, T1, T2, T3, T4>>, arg1: T1, arg2: T2, arg3: T3, arg4: T4): T;
	<T1, T2, T3, T4, T5>(fn: Callable<Func5<any, T1, T2, T3, T4, T5>>, arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5): T;
	<T1, T2, T3, T4, T5, T6>(fn: Callable<Func6<any, T1, T2, T3, T4, T5, T6>>, arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5, arg6: T6, ...rest: any[]): T;
};
