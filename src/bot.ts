import Fuse from 'fuse.js';
import { addDays, setHours, setMinutes, setSeconds, isAfter, isBefore, differenceInMinutes, getDay, getWeek, parse } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import Telegraf, { ContextMessageUpdate, Markup } from 'telegraf';
import _ from 'lodash';
import humanizeDuration from 'humanize-duration';

import { createAPI } from './data/api';
import { Curriculum } from './data/curriculum';
import { readLocale } from './locales/Locale';
import { errorMiddleware, sendSomethingWentWrong } from './parts/error-middleware';
import { alignButtons } from './utils/buttons';
import { createCache } from './utils/cache';
import { hash } from './utils/hash';
import { Env } from './env';

const dayNames = [
	'monday',
	'tuesday',
	'wednesday',
	'thursday',
	'friday',
	'saturday',
	'sunday',
];

export const main = async (env: Env, bot: Telegraf<ContextMessageUpdate>) => {
	const locale = await readLocale(env.LOCALE);

	const api = createAPI(
		locale,
		env.SHEETS_API_TOKEN,
		env.SHEETS_ROOT_URL,
	);

	const getNow = () => utcToZonedTime(new Date(), env.TIMEZONE);

	const me = await bot.telegram.getMe();
	bot.options.username = me.username;

	bot.catch(console.error);
	bot.use(errorMiddleware(locale));

	const onStart = async (ctx: ContextMessageUpdate): Promise<void> => {
		const settings = await api.globalSettings();

		const extra = Markup
			.keyboard([
				[
					locale('buttons.contribute'),
					locale('buttons.rings'),
					locale('buttons.time'),
				],
				...alignButtons(settings.groups.map(it => it.name), 2),
			])
			.oneTime(false)
			.resize(true)
			.extra()
		;

		await ctx.reply(locale('replies.select-group'), extra);
	};

	bot.start(onStart);
	bot.hears([
		locale('buttons.menu'),
		locale('buttons.back'),
	], onStart);

	bot.hears(/^\/ask\s+(.*)$/, async ctx => {
		const from = ctx.from!;
		const message = ctx.match![1]!.trim();

		await ctx.reply(locale('replies.ask.reply'));

		await bot.telegram.sendMessage(env.MAINTAINER_ID, locale('replies.ask.message', {
			username: from.username!,
			id: String(from.id),
			message,
		}));
	});

	bot.hears(/^\/reply\s+([^\s]*)\s+(.*)$/, async ctx => {
		const id = Number(ctx.match![1]!);
		const message = ctx.match![2]!.trim();

		await ctx.reply(locale('replies.reply.reply'));

		await bot.telegram.sendMessage(id, locale('replies.reply.message', {
			message,
		}));
	});

	bot.hears(/^\/add\s+([^\s]+)\s+(.*)$/, async ctx => {
		const from = ctx.from!;
		const group = ctx.match![1]!;
		const url = ctx.match![2]!.trim();

		try {
			await api.testCurriculum(url);
		} catch (e) {
			console.error(e);
			await ctx.reply(locale('replies.add.error'));
			return;
		}

		await ctx.reply(locale('replies.add.reply'));

		await bot.telegram.sendMessage(env.MAINTAINER_ID, locale('replies.add.message', {
			username: from.username!,
			id: String(from.id),
			group,
			url,
		}));
	});

	const buildRingTimes = async () => {
		const settings = await api.globalSettings();

		return [
			locale('replies.rings.header'),
			...settings.rings.map((it, i) => (
				locale('replies.rings.item', {
					index: String(i + 1),
					start: it.start,
					end: it.end,
				})
			))
		].join('\n');
	};

	const buildTime = async () => {
		const settings = await api.globalSettings();

		const now = getNow();

		const times = _(settings.rings)
			.map(it => [it.start, it.end])
			.flatten()
			.map(it => it.split(':'))
			.map(it => setHours(setMinutes(setSeconds(now, 0), Number(it[1])), Number(it[0])))
			.value()
		;

		const nextIndex = times.findIndex(it => isAfter(it, now));

		let nowIsBreak: boolean;
		let nextTime: Date;
		let ringTimeIndex = 0;

		if (nextIndex === -1) {
			nowIsBreak = true;
			if (isBefore(now, times[0])) {
				nextTime = times[0];
			} else {
				nextTime = addDays(times[0], 1);
			}
			ringTimeIndex = 0;
		} else if (nextIndex % 2 === 0) {
			nowIsBreak = true;
			nextTime = times[nextIndex];
			ringTimeIndex = nextIndex / 2;
		} else {
			nowIsBreak = false;
			nextTime = times[nextIndex];
			ringTimeIndex = (nextIndex - 1) / 2;
		}

		const durationString = humanizeDuration(differenceInMinutes(nextTime, now) * 60 * 1000, {
			language: env.LOCALE,
		});

		return [
			locale('replies.time.header'),
			locale('replies.time.template', {
				stamp: locale(nowIsBreak ? 'replies.time.stamps.start' : 'replies.time.stamps.end'),
				number: locale(`replies.time.numbers.${ringTimeIndex + 1}`),
				duration: durationString,
			}),
		].join('\n');
	};

	const buildDayCurriculum = async (
		type: string,
		groupName: string,
		curriculum: Curriculum,
		now: Date,
	) => {
		const settings = await api.globalSettings();

		const today = (getDay(now) + 6) % 7;
		const week = getWeek(now) - getWeek(parse(
			settings.settings.find(it => it.key === locale('table.settings.keys.first-week'))!.value,
			'yyyy.MM.dd',
			now,
		));
		const half = week % 2;

		const info = {
			group: groupName,
			day: locale(`days.${dayNames[today]}.short`),
			week: locale(`weeks.format`, {
				number: String(week + 1),
			}),
			half: locale(`weeks.half.${half}`),
		};

		const prefix = locale(`replies.curriculum.${type}.header`, info);

		if (!curriculum[today]) {
			return prefix + '\n' + locale(`replies.curriculum.${type}.empty`);
		}

		return [
			prefix,
			...(
				curriculum[today]
					.map(it => it instanceof Array ? it[half] : it)
					.map((it, i) => locale(
						it ? `replies.curriculum.${type}.item` : `replies.curriculum.${type}.item-empty`,
						{
							index: String(i + 1),
							name: it || '',
						},
					))
			)
		].join('\n');
	};

	const buildTodayCurriculum = async (groupName: string, curriculum: Curriculum) => (
		await buildDayCurriculum(
			'today',
			groupName,
			curriculum,
			getNow(),
		)
	);

	const buildTomorrowCurriculum = async (groupName: string, curriculum: Curriculum) => (
		await buildDayCurriculum(
			'tomorrow',
			groupName,
			curriculum,
			addDays(getNow(), 1),
		)
	);

	const buildWeekCurriculum = async (
		type: string,
		groupName: string,
		curriculum: Curriculum,
		now: Date,
	) => {
		const settings = await api.globalSettings();

		const week = getWeek(now) - getWeek(parse(
			settings.settings.find(it => it.key === locale('table.settings.keys.first-week'))!.value,
			'yyyy.MM.dd',
			now,
		));
		const half = week % 2;

		const info = {
			group: groupName,
			week: locale(`weeks.format`, {
				number: String(week + 1),
			}),
			half: locale(`weeks.half.${half}`),
		};

		const prefix = locale(`replies.curriculum.${type}.header`, info);

		return [
			prefix,
			...(
				_(curriculum)
					.map((day, i) => (
						day
							? [
								locale(`replies.curriculum.${type}.day`, {
									name: locale(`days.${dayNames[i]}.short`),
								}),
								...day
									.map(it => it instanceof Array ? it[half] : it)
									.map((it, i) => locale(
										it ? `replies.curriculum.${type}.item` : `replies.curriculum.${type}.item-empty`,
										{
											index: String(i + 1),
											name: it || '',
										},
									))
							]
							: undefined
					))
					.filter()
					.flatten()
					.value()
			),
		].join('\n');
	};

	const buildCurrentWeekCurriculum = async (groupName: string, curriculum: Curriculum) => (
		await buildWeekCurriculum(
			'week',
			groupName,
			curriculum,
			getNow(),
		)
	);

	const buildNextWeekCurriculum = async (groupName: string, curriculum: Curriculum) => (
		await buildWeekCurriculum(
			'next-week',
			groupName,
			curriculum,
			addDays(getNow(), 7),
		)
	);

	bot.hears(locale('buttons.rings'), async ctx => {
		await ctx.replyWithMarkdown(
			await buildRingTimes(),
		);
	});

	bot.hears(locale('buttons.time'), async ctx => {
		await ctx.replyWithMarkdown(
			await buildTime(),
		);
	});

	bot.hears(locale('buttons.contribute'), async ctx => {
		await ctx.replyWithMarkdown(locale('replies.contribute.reply', {
			exampleUrl: env.SHEETS_EXAMPLE_URL,
		}));
	});

	bot.hears(/^(.*): (.*)$/, async ctx => {
		const [, groupName, actionName] = ctx.match!;

		const curriculum = await api.groupCurriculum(groupName);

		if (!curriculum) {
			return await sendSomethingWentWrong(ctx, locale, locale('errors.unknown-group'));
		}

		switch (actionName) {
		case locale('buttons.curriculum.today'):
			await ctx.replyWithMarkdown(
				await buildTodayCurriculum(groupName, curriculum),
			);
			break;

		case locale('buttons.curriculum.tomorrow'):
			await ctx.replyWithMarkdown(
				await buildTomorrowCurriculum(groupName, curriculum),
			);
			break;

		case locale('buttons.curriculum.week'):
			await ctx.replyWithMarkdown(
				await buildCurrentWeekCurriculum(groupName, curriculum),
			);
			break;

		case locale('buttons.curriculum.next-week'):
			await ctx.replyWithMarkdown(
				await buildNextWeekCurriculum(groupName, curriculum),
			);
			break;

		default:
			await sendSomethingWentWrong(ctx, locale);
		}

		return;
	});

	bot.on('text', async ctx => {
		if (!ctx.chat || ctx.chat.type !== 'private') {
			return;
		}

		const settings = await api.globalSettings();
		const text = ctx.message!.text!;

		if (text.startsWith('/')) {
			await sendSomethingWentWrong(ctx, locale, locale('errors.unknown-command'));
		}

		if (!settings.groups.find(it => it.name === text)) {
			await sendSomethingWentWrong(ctx, locale, locale('errors.unknown-group'));
		}

		const buttons = [
			...alignButtons([
				`${text}: ${locale('buttons.curriculum.today')}`,
				`${text}: ${locale('buttons.curriculum.tomorrow')}`,
				`${text}: ${locale('buttons.curriculum.week')}`,
				`${text}: ${locale('buttons.curriculum.next-week')}`,
			], 2),
			...alignButtons([
				locale('buttons.rings'),
				locale('buttons.time'),
				locale('buttons.menu'),
			], 3),
		];

		const extra = Markup
			.keyboard(buttons)
			.oneTime(false)
			.resize(true)
			.extra()
		;

		await ctx.reply(locale('prompt'), extra);
	});

	type Answer = {
		title: string;
		content: () => Promise<string>;
	};

	const groupsFuseGetter = createCache()({
		interval: 60,
		intervalFn: interval => interval,
		lifetime: Infinity,
	})(async () => {
		const settings = await api.globalSettings();

		const actions: Answer[] = [
			{
				title: locale('buttons.rings'),
				content: buildRingTimes,
			},
			{
				title: locale('buttons.time'),
				content: buildTime,
			},
			...await Promise.all(
				_(settings.groups)
					.map(({ name }) => [
						{
							title: `${name}: ${locale('buttons.curriculum.today')}`,
							content: async () => await buildTodayCurriculum(
								name,
								(await api.groupCurriculum(name))!,
							),
						},
						{
							title: `${name}: ${locale('buttons.curriculum.tomorrow')}`,
							content: async () => await buildTomorrowCurriculum(
								name,
								(await api.groupCurriculum(name))!,
							),
						},
						{
							title: `${name}: ${locale('buttons.curriculum.week')}`,
							content: async () => await buildCurrentWeekCurriculum(
								name,
								(await api.groupCurriculum(name))!,
							),
						},
						{
							title: `${name}: ${locale('buttons.curriculum.next-week')}`,
							content: async () => await buildNextWeekCurriculum(
								name,
								(await api.groupCurriculum(name))!,
							),
						},
					])
					.flatten()
					.value()
			),
		];

		return new Fuse(actions, {
			keys: [
				'title',
			],
		});
	});

	bot.on('inline_query', async ctx => {
		let answers: Answer[];

		if (ctx.inlineQuery!.query.length < 2) {
			answers = [
				{
					title: locale('buttons.rings'),
					content: buildRingTimes,
				},
				{
					title: locale('buttons.time'),
					content: buildTime,
				},
			];
		} else {
			const fuse = await groupsFuseGetter();

			answers = (
				await Promise.all(
					fuse.search(ctx.inlineQuery!.query).slice(0, 50),
				)
			).map(it => it.item);
		}

		await ctx.answerInlineQuery(
			await Promise.all(
				answers
					.map(async item => ({
						type: 'article',
						id: hash(item.title),
						title: item.title,
						'input_message_content': {
							'message_text': await item.content(),
							'parse_mode': 'Markdown',
						},
					}))
			),
			{
				'cache_time': process.env.NODE_ENV === 'development' ? 0 : 30,
				'is_personal': false,
			},
		);
	});
};
