import { registerStandardEffect } from './standardEffects';
import { IEffect, IEffectFactory, IResolverFactory, LoggerLevel, IEffectSignature, ILogger, IEffectContext, ICallback } from './types';

const effectIdentifierKey = '@SagaLight/effect';

export function createEffectFactory<TData, TOutput>(
	effectName: string,
	create: () => IEffect<TData, TOutput>,
	isStandard: boolean = false,
): IEffectFactory<TData, TOutput> {

	const factory = createResolverFactory(
		effectName,
		/* test */
		(result: any): boolean => result[effectIdentifierKey] === effectName,
		create,
		isStandard) as IEffectFactory<TData, TOutput>;

	factory.signature = (...args: any[]): IEffectSignature => ({
		args,
		[effectIdentifierKey]: effectName,
	});

	return factory;
}

export function createResolverFactory<TData, TOutput>(
	effectName: string,
	test: (result: TData) => boolean,
	create: () => IEffect<TData, TOutput>,
	isStandard: boolean): IResolverFactory<TData, TOutput> {

	const factory: IResolverFactory = {
		effectName,
		create: ensureCreateHasEffectName(effectName, create),
		canResolve: test,
	};

	if (isStandard) {
		registerStandardEffect(factory);
	}

	return factory;
}

function ensureCreateHasEffectName<TData, TOutput>(
	effectName: string,
	create: () => IEffect<TData, TOutput>) {
	return () => {
		const effectInstance = create();
		const name = effectName || 'unnamedEffect';

		effectInstance.name = name;

		const { run, cancel } = effectInstance;
		// wrapping effect run and cancel to add logging
		// in addition let's never run a cancelled effect and never cancel effect that hasn't been run
		let effectContext: IEffectContext;
		let isCancelled = false;

		effectInstance.run = function (v, next, e) {
			if (isCancelled) {
				return;
			}

			if (effectContext) {
				log(effectContext.logger, 'warn', `${effectContext.taskId} attempt to run an already started effect '${name}'`);
				return;
			}


			effectContext = e;
			log(effectContext.logger, 'info', `${effectContext.taskId} running effect '${name}'`);
			return run.call(effectInstance, v, next, effectContext);
		};

		if (isFunction(cancel)) {
			effectInstance.cancel = function () {
				if (isCancelled) {
					return;
				}

				isCancelled = true;

				if (!effectContext) {
					return;
				}

				log(effectContext.logger, 'info', `${effectContext.taskId} cancelling effect '${name}'`);
				return cancel.call(effectInstance);
			};
		}

		return effectInstance;
	};
}

export function createLogger(...levels: LoggerLevel[]) {
	return (level: LoggerLevel, message: string, error: string | Error = '') => {
		if (levels.indexOf(level) === -1) {
			return;
		}

		if (typeof window === 'undefined') {
			const stack = error instanceof Error ? error.stack : error;
			console.log(`SagaLight ${level}: ${message}\n${stack}`);
		} else {
			console[level](message, error);
		}
	};
}

export function isFunction(test: any): test is Function {
	return typeof test === 'function';
}

export function isIterator(obj: Iterator<any>): obj is Iterator<any> {
	return isFunction(obj.next) && isFunction(obj.throw);
}


export function log(logger: ILogger | null, level: LoggerLevel, message: string, error?: string | Error) {
	if (logger) {
		logger(level, message, error);
	}
}

export function runEffect(effect: IEffect<any, any> | null, value: any, next: ICallback, effectContext: IEffectContext) {
	if (effect) {
		effect.run(value, next, effectContext);
	} else {
		log(effectContext.logger, 'info', `${effectContext.taskId} resolving value without effect`);
		next(null, value);
	}
}

export function cancelEffect(effect: IEffect<any, any> | null) {
	if (effect && isFunction(effect.cancel)) {
		effect.cancel();
	}
}
