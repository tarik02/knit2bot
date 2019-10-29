import { Curriculum } from '../curriculum';

const curriculum: Curriculum = {
	'Tu': [
		{
			subject: 'Фіз.виховання',
		},
		{
			subject: 'Іноземна мова',
			room: 'Л.102',
		},
		[
			{
				subject: 'Фізика',
				room: 'Л.317',
			},
			undefined,
		],
		[
			{
				subject: 'Історія держ.',
				room: 'Л.3',
			},
			undefined,
		],
	],
	'We': [
		undefined,
		{
			subject: 'Лінійна алгебра',
			room: 'Л.304',
		},
		{
			subject: 'Фізика',
			room: 'Л.322',
		},
		{
			subject: 'Фізика',
			room: 'Л.3',
		},
	],
	'Th': [
		undefined,
		{
			subject: 'Фіз.виховання',
		},
		{
			subject: 'Осн.акад.письма',
			room: 'Л.313',
		},
		{
			subject: 'Алгор.і структури',
			room: 'П.211/П.18',
		},
		[
			{
				subject: 'Алгор.і структури',
				room: 'П.212а',
			},
			undefined,
		],
	],
	'Fr': [
		undefined,
		{
			subject: 'Історія держ.',
			room: 'Л.314',
		},
		{
			subject: 'Лінійна алгебра',
			room: 'Л.320',
		},
		{
			subject: 'Осн.програмування',
			room: 'П.18/П.213',
		},
		{
			subject: 'Алгор.і структури',
			room: 'П.212а',
		},
	],
	'Sa': [
		[
			undefined,
			{
				subject: 'Осн.програмування',
				room: 'П.44',
			},
		],
		[
			undefined,
			{
				subject: 'Осн.програмування',
				room: 'П.219',
			},
		],
	],
};

export default curriculum;
