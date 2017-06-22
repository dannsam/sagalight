import { Task } from '../core/task';
import { ICallback, IEffect, SagaError } from '../core/types';

function makeAsync() {
	return 'makeAsync';
}


function createAsyncEffect(): IEffect<any, any> {
	return {
		name: 'async',
		run(_: any, runData: any) {
			Promise.resolve().then(() => runData.next(null, null));
		},
	};
}

describe('Task -', () => {
	const oneYieldIterator = function* () { yield 5; };
	const asyncIterator = function* () { yield 'makeAsync'; };
	const expectedError = new Error('oh ah');
	const asyncErrorIterator = function* () { yield 'makeAsync'; throw expectedError; };
	const errorIterator = function* () { yield 5; throw expectedError; };

	function createTask(it: Iterator<any>, cb: ICallback, getEffect?: (result: any) => IEffect<any, any> | null) {
		return new Task('test', it, {
			logger: null,
			getEffect: getEffect || ((result): IEffect<any, any> | null => {
				if (result === 'makeAsync') {
					return createAsyncEffect();
				}

				return null;
			}),
			callback: cb,
		});
	}

	it('Executes complete callback when no child tasks', (done) => {
		const task = createTask(oneYieldIterator(), (error) => {
			expect(error).toBe(null);
			done();
		});

		task.start();
	});

	it('Sync task without children completes immediately', () => {
		const task = createTask(oneYieldIterator(), () => { });

		task.start();
		expect(task.state).toBe('complete');
	});

	it('Executes complete callback when async iterator', (done) => {
		const task = createTask(asyncIterator(), (error) => {
			expect(error).toBe(null);
			expect(task.state).toBe('complete');
			done();
		});

		task.start();
	});

	it('Executes complete callback after all child tasks done', (done) => {
		const task = createTask(oneYieldIterator(), (error) => {
			expect(error).toBe(null);
			expect(task.state).toBe('complete');
			expect(childTask.state).toBe('complete');
			done();
		});

		const childTask = task.scheduleChildTask({
			iterator: oneYieldIterator(),
			name: 'childTask',
		});

		task.start();
	});

	it('Executes complete callback after async iterator and all child tasks are done', (done) => {
		const task = createTask(asyncIterator(), (error) => {
			expect(error).toBe(null);
			expect(task.state).toBe('complete');
			expect(childTask.state).toBe('complete');
			done();
		});

		const childTask = task.scheduleChildTask({
			iterator: oneYieldIterator(),
			name: 'childTask',
		});

		task.start();
	});

	it('Executes complete callback with error', (done) => {
		const task = createTask(errorIterator(), (error) => {
			expect(error).toBe(expectedError);
			done();
		});

		task.start();
	});

	it('Error handling - properly cancel non-started child tasks when the main task fails', (done) => {
		const task = createTask(errorIterator(), (error) => {
			expect(error).toBe(expectedError);
			expect(task.state).toBe('failed');
			expect(childTask.state).toBe('cancelled');
			done();
		});

		const childTask = task.scheduleChildTask({
			iterator: oneYieldIterator(),
			name: 'childTask',
		});

		task.start();
	});

	it('Error handling - properly cancel non-started child tasks when main task cancelled', (done) => {
		const task = createTask(asyncIterator(), (error) => {
			expect(error).toBe(null);
			expect(task.state).toBe('cancelled');
			expect(childTask.state).toBe('cancelled');
			done();
		});

		const childTask = task.scheduleChildTask({
			iterator: oneYieldIterator(),
			name: 'childTask',
		});

		task.start();
		task.cancel();
	});

	it('Error handling - cancels started child tasks when the main task fails', (done) => {
		const task = createTask(asyncErrorIterator(), (error) => {
			expect(error).toBe(expectedError);
			expect(task.state).toBe('failed');
			expect(childTask.state).toBe('cancelled');
			done();
		});

		const childTask = task.scheduleChildTask({
			iterator: (function* (): any {
				while (true) {
					yield makeAsync();
				}
			})(),
			name: 'childTask',
		});

		task.start();
	});

	it('Error handling - fails main task when error in child task', (done) => {
		const task = createTask(oneYieldIterator(), (error) => {
			expect(error).toBe(expectedError);
			expect(task.state).toBe('failed');
			expect(childTask.state).toBe('failed');
			done();
		});

		const childTask = task.scheduleChildTask({
			iterator: errorIterator(),
			name: 'childTask',
		});

		task.start();
	});

	it('Error handling - when iterator does not support throw', (done) => {
		const task = createTask(
			{
				next: () => ({ done: false, value: '' }),
			},
			(error) => {
				expect(error).toBe(expectedError);
				expect(task.state).toBe('failed');
				done();
			}, () => {
				return {
					name: 'testEffect',
					run(_, runData) {
						runData.next(expectedError);
					},
				};
			});

		task.start();
	});

	it('Error handling - when iterator does support throw and handles error', (done) => {
		const task = createTask(
			{
				next: () => ({ done: false, value: '' }),
				throw: () => ({ done: true, value: undefined }),
			},
			(error) => {
				expect(error).toBeNull();
				expect(task.state).toBe('complete');
				done();
			}, () => {
				return {
					name: 'testEffect',
					run(_, runData) {
						runData.next(expectedError);
					},
				};
			});
		task.start();
	});


	it('Cancel task - when iterator does not support return', (done) => {
		const iteratorSpy = jasmine.createSpyObj('iteratorResult', {
			next: { done: false, value: 'makeAsync' },
		});

		const task = createTask(
			iteratorSpy,
			(error) => {
				expect(error).toBeNull();
				expect(task.state).toBe('cancelled');
				done();
			});

		task.start();
		task.cancel();
	});

	it('Cancel task - when iterator supports return', (done) => {
		const iteratorSpy = jasmine.createSpyObj('iteratorResult', {
			next: { done: false, value: 'makeAsync' },
			return: { done: true, value: undefined },
		});

		const task = createTask(
			iteratorSpy,
			(error) => {
				expect(error).toBeNull();
				expect(task.state).toBe('cancelled');
				expect(iteratorSpy.return).toHaveBeenCalled();
				done();
			});

		task.start();
		task.cancel();
	});

	it('Cancel task - cancels current cancellable effect', (done) => {
		const iteratorSpy = jasmine.createSpyObj('iteratorResult', {
			next: { done: false, value: 'cancellable' },
		});

		const cancelSpy = jasmine.createSpy('cancelEffect');
		const getEffectSpy = jasmine.createSpy('getEffectSpy').and.callFake(() => {
			return {
				name: 'cancellable',
				run: () => { },
				cancel: cancelSpy,
			};
		});

		const task = createTask(
			iteratorSpy,
			(error) => {
				expect(error).toBeNull();
				expect(task.state).toBe('cancelled');
				expect(cancelSpy).toHaveBeenCalled();
				done();
			}, getEffectSpy);

		task.start();
		task.cancel();
	});

	it('Cancel task - cancels the current cancellable effect following by an effect', (done) => {
		const cancelSpy = jasmine.createSpy('cancelEffect');
		const getEffectSpy = jasmine.createSpy('getEffectSpy').and.callFake(() => {
			return {
				name: 'cancellable',
				run: () => { },
				cancel: cancelSpy,
			};
		});

		const task = createTask(
			function* () {
				yield 'nonCancellable';
				yield 'cancellable';
			}(),
			(error) => {
				expect(error).toBeNull();
				expect(task.state).toBe('cancelled');
				expect(cancelSpy).toHaveBeenCalled();
				done();
			}, getEffectSpy);

		task.start();
		task.cancel();
	});

	it('Error handling - fails the task when cancelling effect fails', (done) => {
		const iteratorSpy = jasmine.createSpyObj('iteratorResult', {
			next: { done: false, value: 'cancellable' },
		});

		const cancelSpy = jasmine.createSpy('cancelEffect').and.throwError(expectedError as any);

		const task = createTask(
			iteratorSpy,
			(error) => {
				expect(error).toBe(expectedError);
				expect(task.state).toBe('failed');
				expect(cancelSpy).toHaveBeenCalled();
				done();
			}, () => ({
				name: 'test',
				run: () => { },
				cancel: cancelSpy,
			}));

		task.start();
		task.cancel();
	});

	it('Error handling - errors bubble up', (done) => {
		const iteratorSpy = jasmine.createSpyObj('iteratorResult', {
			next: { done: false, value: 'never_ending' },
			throw: { done: true, value: undefined },
		});

		const task = createTask(
			iteratorSpy,
			(error: SagaError) => {
				expect(error).not.toBeNull();

				const stack = error.sagaStack;
				expect(stack).toContain('at childTask');
				expect(stack).toContain('at test');
				expect(childTask.state).toBe('failed');
				expect(task.state).toBe('failed');
				done();
			}, (result) => {
				if (result === 'never_ending') {
					return {
						effectName: 'testEffect',
						run: () => {
							// never ending effect
						},
					};
				}
				return null;
			});

		const childTask = task.scheduleChildTask({
			iterator: errorIterator(),
			name: 'childTask',
		});
		task.start();
	});

	it('Passes correct value to getEffect', () => {
		const getEffectSpy = jasmine.createSpy('getEffectSpy');

		const task = createTask(
			function* () {
				yield 'effect1';
				yield 'effect2';
			}(),
			() => {
			}, getEffectSpy);

		task.start();

		expect(task.state).toBe('complete');
		expect(getEffectSpy).toHaveBeenCalledWith('effect1');
		expect(getEffectSpy).toHaveBeenCalledWith('effect2');
	});

});
