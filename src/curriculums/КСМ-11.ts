import { Curriculum } from '../curriculum';

const curriculum: Curriculum = {
	'Tu': [
		{
			subject: 'Програмування',
			room: 'Л.303'
		},
		{
			subject: 'Фіз. Виховання'
		},
	],
	'We': [
		{
			subject: 'Вища математика',
			room: 'Л.404',
		},
		[
			{
				subject: 'Укр. мова',
				room: 'Л.1',
			},
			{
				subject: 'Філософія',
				room: 'Л.36',
			},
		],
		{
			subject: 'Вища математика',
			room: 'Л.2',
		},
		{
			subject: 'Іноземна мова (нім.)',
			room: 'Л.241'
		},
	],
	'Th': [
		undefined,
		{
			subject: 'Філософія',
			room: 'Л.324',
		},
		{
			subject: 'Укр. мова',
			room: 'Л.231',
		},
	],
	'Fr': [
		undefined,
		{
			subject: 'Програмування',
			room: 'Л.303',
		},
		{
			subject: 'Фізика',
			room: 'Л.317',
		},
		{
			subject: 'Фізика',
			room: 'Л.322',
		},
	],
	'Sa': [
		{
			subject: 'Іноземна мова',
			room: 'Л.241',
		},
		{
			subject: 'Програмування',
			room: 'Л.303',
		},
	],
};

export default curriculum;
