

import { callEffectFactory } from '../effects/call';
import { call, runSaga } from '../sagalight';

describe('Call -', () => {

	it('integration - executes simple function', (done) => {
		const spy = jasmine.createSpy('simpleFunction').and.returnValue('returnValue');

		function* test() {
			const result = yield call(spy, 'arg1', 'arg2');

			expect(spy).toHaveBeenCalledWith('arg1', 'arg2');
			expect(result).toBe('returnValue');
			done();
		}

		runSaga(test);
	});

	it('integration - executes simple iterator', (done) => {
		function* simpleIterator(input: string) {
			return input;
		}

		function* test() {
			const result = yield call(simpleIterator, 'arg1');

			expect(result).toBe('arg1');
			done();
		}

		runSaga(test);
	});


	it('executes simple function', (done) => {
		const effect = callEffectFactory.create();

		const spy = jasmine.createSpy('simpleFunction').and.returnValue('returnValue');

		effect.run({
			args: [spy, 'arg1', 'arg2'],
		}, (error: Error, result: any) => {
			expect(spy).toHaveBeenCalledWith('arg1', 'arg2');
			expect(error).toBeNull();
			expect(result).toBe('returnValue');
			done();
		}, { getEffect() { return null; } } as any);
	});

	it('handles error executing simple function', (done) => {
		const expectedError = new Error('error');
		const effect = callEffectFactory.create();

		const spy = jasmine.createSpy('simpleFunction').and.throwError(expectedError as any);

		effect.run({
			args: [spy],
		}, (error: Error) => {
			expect(error).toBe(expectedError);
			done();
		}, {} as any);
	});
});
