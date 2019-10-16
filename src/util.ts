type MemoizedResult<T> = {
	(): T;
	flush: () => void;
};

export const memoized = <T>(fn: () => T, ttl: number): MemoizedResult<T> => {
	let cache: T | undefined;
	let timeout: ReturnType<typeof setTimeout> | undefined;

	const flush = () => {
		cache = undefined;

		if (timeout !== undefined) {
			clearTimeout(timeout);
			timeout = undefined;
		}
	};

	const result = () => {
		if (cache !== undefined) {
			return cache;
		}

		timeout = setTimeout(flush, ttl);
		return cache = fn();
	};

	result.flush = flush;
	return result as MemoizedResult<T>;
};
