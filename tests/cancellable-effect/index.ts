
import run from '../../src/run';
let cancelledEffect = false;

const TestCancellableEffect: ICancellableEffect = {
    canResolveResult(result): result is any  {
        return true;
    },
    run(result, runData) {
        //ever lasting effect

        return {
            cancel(cb) {
                cancelledEffect = true;
                cb(null);
            }
        };
    },
}

const task = run({effects: [TestCancellableEffect]}, function* test () {
    //starts ever-lasting effect
    yield null;
});

task.cancel();

console.log(`cancelledEffect ${cancelledEffect} should be true`)
