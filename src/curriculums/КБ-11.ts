import { Curriculum } from '../curriculum';

const curriculum: Curriculum = {
	'Tu': [
		{
			subject: 'Дискретна матем.',
			room: 'Л.411'
		},
		{
			subject: 'Фіз.виховання'
		},
		{
			subject: 'Програмування',
			room: 'Л.1'
		},
		[
			{
				subject: 'Історія держ.',
				room: 'Л.3'
			},
			{
				subject: 'Дискр.матем.',
				room: 'Л.303'
			},
		],
	],
	'We': [
		{
			subject: 'Комп. графіка',
			room: 'Л.400',
		},
		[
			{
				subject: 'Комп. графіка',
				room: 'Л.400',
			},
			{
				subject: 'Дискр.матем.',
				room: 'Л.301',
			},
		],
		{
			subject: 'Дискр. матем.',
			room: 'Л.301',
		},
		{
			subject: 'Програмування',
			room: 'Л.39',
		},
	],
	'Th': [
		{
			subject: 'Історія укр.держ.',
			room: 'Л.153',
		},
		{
			subject: 'Фіз.виховання'
		},
	],
	'Fr': [
		undefined,
		{
			subject: 'Вища.матем.',
			room: 'Л.304',
		},
		{
			subject: 'Вища.матем.',
			room: 'Л.304',
		},
		{
			subject: 'Іноземна мова',
			room: 'Л.241',
		},
	],
	'Sa': [
		{
			subject: 'Осн.акад.письма',
			room: 'Л.153',
		},
		{
			subject: 'Дискр.матем.',
			room: 'Л.313',
		},
		{
			subject: 'Програмування',
			room: 'Л.303a',
		},
	],
};

export default curriculum;
