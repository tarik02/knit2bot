export type Day =
	| 'Mo'
	| 'Tu'
	| 'We'
	| 'Th'
	| 'Fr'
	| 'Sa'
	| 'Su'
	;
export const Day: ReadonlyArray<Day> = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export type Subject = string;
export type Room = string;

export type Lesson = {
	subject: Subject;
	room?: Room;
};

export type DayCurriculum = ReadonlyArray<
	| Lesson
	| [Lesson, Lesson | undefined]
	| [Lesson | undefined, Lesson]
	| [Lesson, Lesson]
	| undefined
>;

export type Curriculum = Readonly<Partial<Record<Day, DayCurriculum>>>;


export const ringTimes = [
	'08.30 - 09.50',
	'10.00 - 11.20',
	'11.30 - 12.50',
	'13.20 - 14.40',
	'14.50 - 16.10'
];

export const curriculums: Record<string, Curriculum> = {
	'КСМ-11': {
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
			[
				{
					subject: 'Програмування',
					room: 'Л.303а',
				},
				undefined,
			],
		],
		'Th': [
			{
				subject: 'Історія укр.держ.',
				room: 'Л.153',
			},
			{
				subject: 'Фіз.виховання'
			},
			{
				subject: 'Програмування',
				room: 'Л.303а',
			},
		],
		'Fr': [
			{
				subject: 'Іноземна мова',
				room: 'Л.255',
			},
			{
				subject: 'Дискр.матем.',
				room: 'Л.301',
			},
			{
				subject: 'Вища.матем.',
				room: 'Л.304',
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
				subject: 'Вища.матем.',
				room: 'Л.304',
			},
		],
	},

	'ІПЗ-11': {
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
	},

	'КБ-11': {
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
	},
};

export const groups = Object.keys(curriculums);
