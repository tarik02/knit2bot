import { isLeft } from 'fp-ts/lib/Either';
import fetch from 'node-fetch';
import _ from 'lodash';
import * as t from 'io-ts';

import { createCache } from '../utils/cache';
import { report } from '../utils/report';


const Data = t.readonly(t.strict({
	NewConfirmed: t.number,
	TotalConfirmed: t.number,
	NewDeaths: t.number,
	TotalDeaths: t.number,
	NewRecovered: t.number,
	TotalRecovered: t.number,
}));
export type Data = t.TypeOf<typeof Data>;

export const CountryData = t.intersection([
	t.readonly(t.strict({
		Country: t.string,
		CountryCode: t.string,
		Slug: t.string,
		Date: t.string,
	})),
	Data,
]);
export type CountryData = t.TypeOf<typeof CountryData>;

export const createCovidAPI = () => {
	const cache = createCache();

	const getCountriesData = cache({
		interval: 240,
		intervalFn: interval => interval,
		lifetime: Infinity,
	})(async () => {
		try {
			const data = await fetch('https://api.covid19api.com/summary')
				.then(response => response.json())
				.then(data => data['Countries'])
				.then(data => t.array(CountryData).decode(data));

			if (isLeft(data)) {
				throw data.left;
			}

			return _.keyBy(data.right, it => it.CountryCode);
		} catch (e) {
			report(e);

			return {};
		}
	});

	return {
		getCountriesData,
	}
};
