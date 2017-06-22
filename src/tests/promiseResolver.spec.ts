

import { runSaga } from '../sagalight';

describe('Promise resolver -', () => {

	it('is able to resolve a Promise', (done) => {
		runSaga({
			callback() {
				done();
			},
		}, function* () {
			const result = yield Promise.resolve(5);
			return result;
		});
	});
});
