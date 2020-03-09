import _ from 'lodash';

const MAX_BUTTONS_PER_ROW = 8;

const getButtonsPerRowCount = (totalCount: number, maxPerRow: number = MAX_BUTTONS_PER_ROW): number => {
	// would be cool to have a square set of buttons
	const goodPerRowCount = Math.floor(Math.sqrt(totalCount));

	const result = _.range(3, totalCount)
		.map(i =>
			totalCount % i == 0 && totalCount / i >= 3
				? totalCount / i
				: undefined
		)
		.filter((it): it is number => it !== undefined)
		.filter(it => it <= maxPerRow)
		.concat(goodPerRowCount)[0]!
	;

	return Math.min(
		maxPerRow,
		result,
	);
};

export const alignButtons = <T>(buttons: T[], maxPerRow: number = MAX_BUTTONS_PER_ROW): T[][] => {
	if (buttons.length <= 3) {
		return [buttons];
	}

	return _.chunk(buttons, getButtonsPerRowCount(buttons.length, maxPerRow));
};
