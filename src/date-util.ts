import moment from 'moment-timezone';

moment.tz.setDefault('Europe/Kiev');


/**
 * https://www.dlit.dp.ua/navchalnyi-protses/hrafik-navchalnoho-protses/
 *
 * @returns number in range 1..40
 */
export const getCurrentAcamedicWeek = (now: moment.Moment = moment()): number | undefined => {
	const currentWeek = now.week();

	if (now.month() + 1 >= 9) {
		const startWeek = moment(`${now.year()}-09-01`).week();
		const weekNumber = currentWeek - startWeek + 1;

		if (weekNumber < 9) {
			return weekNumber;
		} else if (weekNumber === 9) {
			return undefined;
		} else {
			return weekNumber - 1;
		}
	} else {
		const startWeek = moment(`${now.year()}-01-08`).week();
		const weekNumber = currentWeek - startWeek + 1;

		if (weekNumber < 12) {
			return weekNumber;
		} else if (weekNumber === 12) {
			return undefined;
		} else {
			return weekNumber - 1;
		}
	}
};

export const getCurrentHalf = (now: moment.Moment = moment()): 0 | 1 | undefined => {
	const week = getCurrentAcamedicWeek(now);
	if (week === undefined) {
		return undefined;
	}

	return week % 2 === 1 ? 0 : 1;
};
