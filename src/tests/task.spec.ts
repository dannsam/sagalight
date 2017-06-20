import { Task } from '../task';

function makeAsync() {
	return 'makeAsync';
}

const makeAsyncEffect: IEffect<any, any> = {
	canResolveResult(result): result is any {
		return result.value === 'makeAsync';
	},
	run(result, runData) {
		// resolve effect async
		Promise.resolve().then(() => runData.next(null, null));
	},
};

fdescribe('Task -', () => {
	const oneYieldIterator = function* () { yield 5; };
	const asyncIterator = function* () { yield makeAsync(); };
	const expectedError = new Error('oh ah');
	const asyncErrorIterator = function* () { yield makeAsync(); throw expectedError; };
	const errorIterator = function* () { yield 5; throw expectedError; };

	function createTask(it: Iterator<any>, cb: ICallback, effects: IEffectCollection = []) {
		return new Task('test', it, {
			effects: [makeAsyncEffect].concat(effects),
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
		const task = createTask(oneYieldIterator(), (error) => { });

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
			}, [{
				canResolveResult: (result): result is any => true,
				run(result, runData) {
					runData.next(expectedError);
				},
			}]);

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
			}, [{
				canResolveResult: (result): result is any => true,
				run(result, runData) {
					runData.next(expectedError);
				},
			}]);

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

	it('Cancel task - cancells current cancellable effect', (done) => {
		const iteratorSpy = jasmine.createSpyObj('iteratorResult', {
			next: { done: false, value: 'cancellable' },
		});

		const cancelSpy = jasmine.createSpy('cancelEffect');

		const effectSpy = jasmine.createSpyObj('effectSpy', {
			canResolveResult: true,
			run: { cancel: cancelSpy },
		});

		const task = createTask(
			iteratorSpy,
			(error) => {
				expect(error).toBeNull();
				expect(task.state).toBe('cancelled');
				expect(cancelSpy).toHaveBeenCalled();
				done();
			}, [effectSpy]);

		task.start();
		task.cancel();
	});

	it('Error handling - fails the task when cancelling effect fails', (done) => {
		const iteratorSpy = jasmine.createSpyObj('iteratorResult', {
			next: { done: false, value: 'cancellable' },
		});

		const cancelSpy = jasmine.createSpy('cancelEffect').and.throwError(expectedError as any);

		const effectSpy = jasmine.createSpyObj('effectSpy', {
			canResolveResult: true,
			run: { cancel: cancelSpy },
		});

		const task = createTask(
			iteratorSpy,
			(error) => {
				expect(error).toBe(expectedError);
				expect(task.state).toBe('failed');
				expect(cancelSpy).toHaveBeenCalled();
				done();
			}, [effectSpy]);

		task.start();
		task.cancel();
	});
});
