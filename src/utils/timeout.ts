export type Timeout =
	& Promise<void>
	& {
		speedup(timeout: number): void;
		cancel(reason?: any): void;
	}
	;

export const timeout = (time: number): Timeout => {
	let resolveFn: () => void;
	let rejectFn: (reason?: any) => void;
	let timeoutHandle: ReturnType<typeof setTimeout> | undefined = undefined;

	let willBeExecutedAt = Date.now() + time;

	const result = (new Promise((resolve, reject) => {
		resolveFn = resolve;
		rejectFn = reject;
	})) as Timeout;

	const executeIn = (time: number) => {
		if (timeoutHandle !== undefined) {
			clearTimeout(timeoutHandle);
		}

		timeoutHandle = setTimeout(() => {
			timeoutHandle = undefined;

			resolveFn();
		}, time);
	};

	result.speedup = time => {
		if (!timeoutHandle || Date.now() + time >= willBeExecutedAt) {
			return;
		}

		willBeExecutedAt = Date.now() + time;

		executeIn(time);
	};

	result.cancel = reason => {
		if (timeoutHandle !== undefined) {
			clearTimeout(timeoutHandle);
			timeoutHandle = undefined;
		}

		rejectFn(reason);
	};

	executeIn(time);

	return result;
};
