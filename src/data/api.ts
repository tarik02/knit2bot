import { google } from 'googleapis';

import { Locale } from '../locales/Locale';
import { memoized } from '../utils/memoized';

import { parseSettings, getSpreadsheetId, parseCurriculum } from './sheets';

export const createAPI = (
	locale: Locale,
	sheetsApiKey: string,
	globalSettingsSheet: string,
) => {
	const settingsDef = {
		[locale('table.rings.name')]: {
			name: 'rings',
			titles: {
				[locale('table.rings.fields.start')]: 'start',
				[locale('table.rings.fields.end')]: 'end',
			},
		},
		[locale('table.settings.name')]: {
			name: 'settings',
			titles: {
				[locale('table.settings.fields.key')]: 'key',
				[locale('table.settings.fields.value')]: 'value',
			},
		},
		[locale('table.groups.name')]: {
			name: 'groups',
			titles: {
				[locale('table.groups.fields.name')]: 'name',
				[locale('table.groups.fields.url')]: 'url',
			},
		},
	};

	const days = [
		locale('days.monday.name'),
		locale('days.tuesday.name'),
		locale('days.wednesday.name'),
		locale('days.thursday.name'),
		locale('days.friday.name'),
		locale('days.saturday.name'),
		locale('days.sunday.name'),
	];

	const globalSettingsSheetId = getSpreadsheetId(globalSettingsSheet);

	const sheets = google.sheets({
		version: 'v4',
		auth: sheetsApiKey,
	});

	const fetchSheet = async (id: string, ranges: string[] = ['A:Z']) => {
		return (await sheets.spreadsheets.values.batchGet({
			spreadsheetId: id,
			ranges,
			majorDimension: 'COLUMNS',
		})).data.valueRanges![0].values!;
	};

	const globalSettings = memoized(async () => {
		return parseSettings(
			await fetchSheet(globalSettingsSheetId),
			settingsDef,
		);
	}, 60 * 1000);

	const groupCurriculum = memoized(async (groupName: string) => {
		const settings = await globalSettings();
		const group = settings.groups.find(it => it.name === groupName);

		if (!group) {
			return undefined;
		}

		const id = getSpreadsheetId(group.url);

		const sheet = await fetchSheet(id);

		return parseCurriculum(sheet, days);
	}, 60 * 1000);

	const testCurriculum = async (url: string) => {
		const id = getSpreadsheetId(url);

		const sheet = await fetchSheet(id);

		parseCurriculum(sheet, days);
	};

	return {
		globalSettings,
		groupCurriculum,
		testCurriculum,
	};
};
