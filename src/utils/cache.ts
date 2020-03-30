import { hash } from './hash';
import { report } from './report';
import { timeout, Timeout } from './timeout';

export type Config = {
	interval: number;
	intervalFn?: (prev: number, initial: number) => number;
	lifetime?: number;
};

export type Fn<T, Args extends any[]> = (...args: Args) => Promise<T>;

const nop = () => {
	//
};

export const createCache = () => {
	return ({
		interval,
		intervalFn = (prev, initial) => prev + initial,
		lifetime = interval * 10,
	}: Config) => <T, Args extends any[]>(fn: Fn<T, Args>): Fn<T, Args> => {
		const fns = new Map<string, () => Promise<T>>();

		const createFn = (args: Args, forget: () => void): () => Promise<T> => {
			let destroyTimeout: Timeout | undefined = undefined;
			let loadTimeout: Timeout | undefined = undefined;

			let promise: Promise<T>;
			let currentInterval = interval;

			const destroy = () => {
				destroyTimeout?.cancel();
				loadTimeout?.cancel();

				forget();
			};

			const updateTimeout = () => {
				destroyTimeout?.cancel();
				loadTimeout?.speedup((currentInterval = interval) * 1000);

				if (lifetime !== Infinity) {
					(destroyTimeout = timeout(lifetime * 1000)).then(destroy, nop);
				}
			};

			const loadData = () => {
				const result = fn(...args).then(value => (promise = Promise.resolve(value)));

				result
					.then(
						() => true,
						error => (report(error), false)
					)
					.then(success => {
						(loadTimeout = timeout((success ? currentInterval : interval) * 1000)).then(loadData, nop);

						if (success) {
							currentInterval = intervalFn(interval, currentInterval);
						}
					})
				;

				return result;
			};

			promise = loadData();

			return () => {
				updateTimeout();

				return promise;
			};
		};

		return (...args: Args) => {
			const key = hash(args);

			if (!fns.has(key)) {
				fns.set(key, createFn(args, () => fns.delete(key)));
			}

			return fns.get(key)!();
		};
	};
};
