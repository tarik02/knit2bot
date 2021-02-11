import { getOrElse, Either } from 'fp-ts/lib/Either';
import _ from 'lodash';

import { cleanDayName } from '../utils/cleanDayName';

import { GlobalSettings } from './types';


export const getSpreadsheetId = (anything: string) => (
	anything
		.replace(/^https?:\/\/docs.google.com\/spreadsheets\/d\//i, '')
		.replace(/\/.*$/, '')
);

type Tables = Record<string, {
	name: string;
	titles: Record<string, string>;
}>;

const get = <L, A>(fa: Either<L, A>): A =>
	getOrElse(left => {
		throw left;
	})(fa as any);

const getHeaders = (values: string[], tables: Tables) => {
	let name: string | undefined = undefined;
	let start = 0;

	const results = [];

	values = [
		...values,
		'-',
	];

	for (let i = 0; i < values.length; ++i) {
		if (values[i] === '') {
			continue;
		}

		if (name === undefined) {
			name = values[i];
			start = i;
			continue;
		}

		const table = tables[name];

		if (table) {
			results.push({
				table,
				start,
				end: i - 1,
			});
		}

		name = values[i];
		start = i;
	}

	return results;
};

const normalizeDayValue = (value: string | undefined): string | undefined => {
	value = value?.trim();

	if (value === undefined || value === '') {
		return undefined;
	}

	return value
		.split('\n')
		.map(it => it.replace(/^[\r\n\t ]/, '').replace(/[\r\n\t ]$/, ''))
		.join(' / ')
};

export const parseSettings = (
	values: string[][],
	tables: Tables,
): GlobalSettings => {
	const headers = getHeaders(values.map(it => it[0]), tables);

	return get(GlobalSettings.decode(_(headers)
		.map(header => {
			const keys = _(_.range(header.start, header.end + 1))
				.map(column => ({
					column,
					key: header.table.titles[values[column][1]],
				}))
				.filter(it => !!it.key)
				.value()
			;

			return [
				header.table.name,
				_(_.times(_.maxBy(values, 'length')!.length).slice(2))
					.map(rowIndex => {
						let empty = true;
						const obj = Object.create(null) as Record<string, string | undefined>;

						keys.forEach(({ column: columnIndex, key }) => {
							const value = _.thru(
								_.get(values, `${columnIndex}.${rowIndex}`),
								it => it ? it.trim() : undefined
							);

							if (!value || value.length === 0 || value === '-') {
								obj[key] = undefined;
							} else {
								empty = false;
								obj[key] = value;
							}
						});

						if (empty) {
							return undefined;
						}

						return obj;
					})
					.filter()
					.value(),
			];
		})
		.fromPairs()
		.value()
	));
};

export const parseCurriculum = (values: string[][], days: string[]) => {
	return _(values)
		.slice(2)
		.map(row => {
			const dayName = cleanDayName(row[0]);
			const day = days.indexOf(dayName);

			const curriculum = _(row)
				.slice(1)
				.chunk(2)
				.map(([first, second]: [string | undefined, string | undefined]) => {
					first = normalizeDayValue(first);
					if (first === '-') {
						first = undefined;
					}

					second = normalizeDayValue(second);

					if (second === '-') {
						second = undefined;
					} else if (second === undefined) {
						second = first;
					}

					if (first === second) {
						return first;
					}

					return [first, second];
				})
				.value()
			;

			return {
				day,
				curriculum,
			};
		})
		.reduce((accum, { day, curriculum }) => {
			accum[day] = curriculum;
			return accum;
		}, new Array(7))
	;
};
