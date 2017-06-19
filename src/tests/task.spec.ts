import { delay, DelayEffect } from '../effects/delay';
import { Task } from '../task';

fdescribe('Task -', () => {
	const oneYieldIterator = function* () { yield 5; };
	const asyncIterator = function* () { yield delay(5); };
	const expectedError = new Error('oh ah');
	const asyncErrorIterator = function* () { yield delay(5); throw expectedError; };
	const errorIterator = function* () { yield 5; throw expectedError; };

	function createTask(it: Iterator<any>, cb: ICallback) {
		return new Task('test', it, {
			effects: [DelayEffect],
			callback: cb,
		});
	}

	beforeEach(() => {
		jasmine.clock().install();
	});

	afterEach(() => {
		jasmine.clock().uninstall();
	});

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
		jasmine.clock().tick(5);
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
		jasmine.clock().tick(5);
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
			iterator: (function* (): any { yield delay(10); })(),
			name: 'childTask',
		});

		task.start();

		// wait for child start to start async
		Promise.resolve().then(() => {
			jasmine.clock().tick(5);
		});
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
				next: (): any => {
					throw expectedError;
				},
			},
			(error) => {
				expect(error).toBe(expectedError);
				expect(task.state).toBe('failed');
				done();
			});

		task.start();
	});
});
