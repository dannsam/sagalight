import { race } from '../effects/race';
import { runSaga, delay } from '../sagalight';

describe('Race -', () => {

	function getEffect(effect: any) {
		return effect;
	}

	function getRaceResult(nextSpy: any) {
		return nextSpy.calls.mostRecent().args[1];
	}

	function resolveEffectSpy(effectSpy: any, data: any) {
		// getting next callback from effect1 arg
		const runData = effectSpy.run.calls.argsFor(0)[1];

		// resolve the effect and ensure that the race callback isn't called
		runData.next(null, data);
	}

	it('resolves effect once', () => {
		const raceEffect = race.create();
		const effect1 = jasmine.createSpyObj('effect1', ['run', 'cancel']);
		const effect2 = jasmine.createSpyObj('effect2', ['run', 'cancel']);
		const nextSpy = jasmine.createSpy('next');

		raceEffect.run({
			data: {
				effect1,
				effect2,
			},
		}, {
			getEffect,
			next: nextSpy,
		} as any);

		resolveEffectSpy(effect2, 'result2');
		resolveEffectSpy(effect1, 'result1');

		expect(effect1.cancel).toHaveBeenCalledTimes(1);
		expect(nextSpy).toHaveBeenCalledTimes(1);

		const result = getRaceResult(nextSpy);

		expect(result).toEqual({ effect2: 'result2' });
	});

	it('never runs if cancelled before start', () => {
		const raceEffect = race.create();
		const effect1 = jasmine.createSpyObj('effect1', ['run', 'cancel']);
		const effect2 = jasmine.createSpyObj('effect2', ['run', 'cancel']);
		const nextSpy = jasmine.createSpy('next');

		raceEffect.cancel();

		raceEffect.run({
			data: {
				effect1,
				effect2,
			},
		}, {
			getEffect,
			next: nextSpy,
		} as any);

		expect(effect1.run).not.toHaveBeenCalled();
		expect(effect1.run).not.toHaveBeenCalled();
		expect(nextSpy).not.toHaveBeenCalled();
	});

	it('never resolves if cancelled', () => {
		const raceEffect = race.create();
		const effect1 = jasmine.createSpyObj('effect1', ['run', 'cancel']);
		const effect2 = jasmine.createSpyObj('effect2', ['run', 'cancel']);
		const nextSpy = jasmine.createSpy('next');

		raceEffect.run({
			data: {
				effect1,
				effect2,
			},
		}, {
			getEffect,
			next: nextSpy,
		} as any);

		expect(effect1.run).toHaveBeenCalledTimes(1);
		expect(effect1.run).toHaveBeenCalledTimes(1);
		raceEffect.cancel();

		expect(effect1.cancel).toHaveBeenCalledTimes(1);
		expect(effect1.cancel).toHaveBeenCalledTimes(1);

		resolveEffectSpy(effect1, null);

		expect(nextSpy).not.toHaveBeenCalled();
	});

	it('resolves unknown effect as is', () => {
		const raceEffect = race.create();
		const nextSpy = jasmine.createSpy('next');

		raceEffect.run({
			data: {
				test: null,
			},
		}, {
			getEffect,
			next: nextSpy,
		} as any);

		expect(nextSpy).toHaveBeenCalled();
		const result = getRaceResult(nextSpy);

		expect(result).toEqual({ test: null });
	});

	it('cancels once even though cancel called twice', () => {
		const raceEffect = race.create();
		const effect1 = jasmine.createSpyObj('effect1', ['run', 'cancel']);
		const effect2 = jasmine.createSpyObj('effect2', ['run', 'cancel']);
		const nextSpy = jasmine.createSpy('next');

		raceEffect.run({
			data: {
				effect1,
				effect2,
			},
		}, {
			getEffect,
			next: nextSpy,
		} as any);

		raceEffect.cancel();
		raceEffect.cancel();

		expect(effect1.cancel).toHaveBeenCalledTimes(1);
		expect(effect1.cancel).toHaveBeenCalledTimes(1);
		expect(nextSpy).not.toHaveBeenCalled();
	});

	it('passes effect description to child effect run', () => {
		const raceEffect = race.create();
		const effect1 = jasmine.createSpyObj('effect1', ['run', 'cancel']);
		const effect2 = jasmine.createSpyObj('effect2', ['run', 'cancel']);
		const nextSpy = jasmine.createSpy('next');

		raceEffect.run({
			data: {
				effect1,
				effect2,
			},
		}, {
			getEffect,
			next: nextSpy,
		} as any);

		expect(effect1.run).toHaveBeenCalledWith(effect1, jasmine.any(Object));
		expect(effect2.run).toHaveBeenCalledWith(effect2, jasmine.any(Object));
	});

	it('integration', (done) => {
		runSaga({
			callback: () => {
				done();
			},
		}, function* () {
			const result = yield race({
				delay1: delay(200),
				delay2: delay(100),
			});

			expect(result).toEqual({
				delay2: null,
			});

			done();
		});
	});

});

