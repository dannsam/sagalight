declare interface IEffectResolver<TInput> {
	canResolveResult(result: IteratorResult<TInput>): result is IteratorResult<TInput>;
}

declare interface ITask {
	scheduleChildTask(child: ITaskStartInfo<any>): ITask;
	next: ICallback;
	isCancelled: boolean;
	cancel(): void;
}

declare interface IEffect<TInput = any, TOutput= any> extends IEffectResolver<TInput> {
	run(result: IteratorResult<TInput>, runData: IEffectRunData<TOutput>): void;
}

declare interface ICancellableEffect<TInput= any, TOutput= any> extends IEffectResolver<TInput> {
	run(result: IteratorResult<TInput>, runData: IEffectRunData<TOutput>): ICancellableEffectInfo;
}

declare interface ICancellableEffectInfo {
	cancel(cb: (error: null | Error) => void): void;
}

declare interface ICallback<T = any> {
	(error: null | Error, result?: T): void;
}

declare interface IEffectRunData<TOutput = any> {
	next: ICallback<TOutput>;
	isTaskCancelled: boolean;
	scheduleChildTask(taskInfo: ITaskStartInfo<any>): ITask
}

declare interface IIteratorFactory<T> {
	(...args: any[]): IterableIterator<T>;
}

declare type IEffectCollection = (IEffect | ICancellableEffect)[];

declare interface IRunOptions {
	effects?: IEffectCollection;
}

declare interface ITaskStartInfo<T> {
	name: string;
	iterator: Iterator<T>;
}
