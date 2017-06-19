
import run from '../../src/run';
let cancelledEffect = false;

const TestCancellableEffect: ICancellableEffect = {
    canResolveResult(result): result is any {
        return true;
    },
    run(result, runData) {
        //ever lasting effect
        return {
            cancel() {
                cancelledEffect = true;
            }
        };
    },
}

const task = run({ effects: [TestCancellableEffect] }, function* test() {
    //starts ever-lasting effect
    yield null;
});

task.cancel();

console.log(`cancelledEffect ${cancelledEffect} should be true`)

console.log(`task.isComplete ${task.isCompleted} should be true`);