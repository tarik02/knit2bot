import fs from 'fs';
import path from 'path';
import _ from 'lodash';

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

export const isDayNotEmpty = (
	curriculum: DayCurriculum | undefined,
	half?: 0 | 1,
): curriculum is DayCurriculum => {
	if (curriculum === undefined) {
		return false;
	}

	if (half === undefined) {
		return false;
	}

	return curriculum
		.map(it => it instanceof Array ? it[half] : it)
		.some(it => it !== undefined)
	;
};

const files = fs.readdirSync(path.join(__dirname, 'curriculums'));
export const curriculums: Record<string, Curriculum> = _.fromPairs(
	files
		.map(it => it.replace(/\.ts$/, ''))
		.sort()
		.map(it => [it, require(`./curriculums/${it}`).default])
);

export const groups = Object.keys(curriculums);
