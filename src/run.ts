import { Task } from "./task";

export default function run<T>(factory: (...args: any[]) => Iterator<T>, ...args: any[]): Task<T> {
	const iterator = factory(...args);
	const task = new Task(factory.name, iterator);

	task.start();

	return task;
}
