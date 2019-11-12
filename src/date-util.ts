import moment from 'moment-timezone';

moment.locale('uk');
moment.tz.setDefault('Europe/Kiev');

export const getCurrentWeekNumber = (now: moment.Moment = moment()): number => {
	const currentWeek = now.week();
	let startWeek;

	if (now.month() + 1 >= 9) {
		startWeek = moment(`${now.year()}-09-01`).week();
	} else {
		// TODO: This is not checked, fix if it is wrong.
		startWeek = moment(`${now.year()}-01-08`).week();
	}

	return currentWeek - startWeek + 1;
};

export const getCurrentHalf = (now: moment.Moment = moment()): 0 | 1 | undefined => {
	const weekNumber = getCurrentWeekNumber(now);
	return (weekNumber % 2 === 1) ? 0 : 1;
};

