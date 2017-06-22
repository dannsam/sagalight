

import { runSaga } from '../sagalight';

describe('Promise resolver -', () => {

	it('is able to resolve a Promise', (done) => {
		runSaga(function* () {
			const result = yield Promise.resolve(5);

			expect(result).toBe(5);
			done();
		});
	});
});
