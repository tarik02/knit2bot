export type Lesson = string;

export type DayCurriculum = ReadonlyArray<
	| Lesson
	| [Lesson, Lesson | undefined]
	| [Lesson | undefined, Lesson]
	| [Lesson, Lesson]
	| undefined
>;

export type Curriculum = Readonly<ReadonlyArray<DayCurriculum>>;
