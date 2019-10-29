import moment from 'moment-timezone';

moment.locale('uk');
moment.tz.setDefault('Europe/Kiev');

export const getCurrentHalf = (now: moment.Moment = moment()): 0 | 1 | undefined => {
	const currentWeek = now.week();

	if (now.month() + 1 >= 9) {
		const startWeek = moment(`${now.year()}-09-01`).week();
		const weekNumber = currentWeek - startWeek + 1;

		return (weekNumber % 2 === 1) ? 0 : 1;
	} else {
		const startWeek = moment(`${now.year()}-01-08`).week();
		const weekNumber = currentWeek - startWeek + 1;

		// TODO: This is not checked, fix if it is wrong.
		return (weekNumber % 2 === 1) ? 0 : 1;
	}
};
