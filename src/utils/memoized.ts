type MemoizedResult<T, A extends any[]> = {
	(...args: A): T;
	flush: () => void;
};

export const memoized = <T, A extends any[]>(
	fn: (...args: A) => T,
	ttl: number,
): MemoizedResult<T, A> => {

	const cache = new Map<string, T>();

	const result = (...args: A) => {
		const key = JSON.stringify(args);

		let cached = cache.get(key);

		if (!cached) {
			cached = fn(...args);
			cache.set(key, cached);

			setTimeout(() => {
				cache.delete(key);
			}, ttl);
		}

		return cached;
	};

	return result as MemoizedResult<T, A>;
};
