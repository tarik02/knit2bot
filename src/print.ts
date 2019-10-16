import { DayCurriculum, Curriculum, Day } from 'curriculum';

export const multilinePad = (value: string, left = '', right = '') => {
	return value
		.split('\n')
		.map(it => `${left}${it}${right}`)
		.join('\n')
	;
};

export const indicify = (value: string, prefix = ''): string => {
	return value
		.split('\n')
		.map((line, i) => `${prefix}*[${i + 1}]* ${line}`)
		.join('\n')
	;
};

export const printHalfName = (half: 0 | 1) => ['Чисельник', 'Знаменник'][half];

export const printDayCurriculum = (value: DayCurriculum, half: 0 | 1) => {
	return value
		.map(it => it instanceof Array ? it[half] : it)
		.map((it, i) => `*[${i + 1}]* ` + (
			it === undefined
				? '-'
				: it.subject + (
					it.room === undefined
						? ''
						: ` (${it.room})`
				)
		))
		.join('\n')
	;
};

export const printWeekCurriculum = (curriculum: Curriculum, half: 0 | 1) => {
	return Object.entries(curriculum)
		.filter((it): it is [Day, DayCurriculum] => it[1] !== undefined)
		.map(([day, dayCurriculum]) => (
			`  *=== ${day} ===*\n` + multilinePad(printDayCurriculum(dayCurriculum, half), '    ')
		))
		.join('\n')
	;
};
