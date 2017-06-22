

import { runSaga } from '../sagalight';

describe('Iterator resolver -', () => {

	it('is able to resolve an Iterator', (done) => {

		function* test() {
			const val = yield 5;
			return val;
		}

		runSaga(function* () {
			const result = yield test();

			expect(result).toBe(5);
			done();
		});
	});
});
