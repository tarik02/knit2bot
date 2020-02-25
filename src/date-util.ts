import moment from 'moment-timezone';

moment.locale('uk');
moment.tz.setDefault('Europe/Kiev');

export const getCurrentWeekNumber = (now: moment.Moment = moment()): number => {
	const currentWeek = now.week();
	const startWeek = moment(`${now.year()}-03-03`).week();

	return currentWeek - startWeek + 1;
};

export const getCurrentHalf = (now: moment.Moment = moment()): 0 | 1 | undefined => {
	const weekNumber = getCurrentWeekNumber(now);
	return (weekNumber % 2 === 1) ? 0 : 1;
};

