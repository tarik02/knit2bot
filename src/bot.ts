import Telegraf, { ContextMessageUpdate, Markup } from 'telegraf';
import { addDays, setHours, setMinutes, setSeconds, isAfter, isBefore, differenceInMinutes, getDay, getWeek, parse } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import _ from 'lodash';
import humanizeDuration from 'humanize-duration';

import { createAPI } from './data/api';
import { Curriculum } from './data/curriculum';
import { readLocale } from './locales/Locale';
import { errorMiddleware, sendSomethingWentWrong } from './parts/error-middleware';
import { alignButtons } from './utils/buttons';
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
				...alignButtons(settings.groups.map(it => it.name), 2),
				[
					locale('buttons.contribute'),
				],
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

	bot.hears(locale('buttons.rings'), async ctx => {
		const settings = await api.globalSettings();

		await ctx.replyWithMarkdown([
			locale('replies.rings.header'),
			...settings.rings.map((it, i) => (
				locale('replies.rings.item', {
					index: String(i + 1),
					start: it.start,
					end: it.end,
				})
			))
		].join('\n'));
	});

	bot.hears(locale('buttons.time'), async ctx => {
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

		await ctx.replyWithMarkdown([
			locale('replies.time.header'),
			locale('replies.time.template', {
				stamp: locale(nowIsBreak ? 'replies.time.stamps.start' : 'replies.time.stamps.end'),
				number: locale(`replies.time.numbers.${ringTimeIndex + 1}`),
				duration: durationString,
			}),
		].join('\n'));
	});

	bot.hears(locale('buttons.contribute'), async ctx => {
		await ctx.replyWithMarkdown(locale('replies.contribute.reply', {
			exampleUrl: env.SHEETS_EXAMPLE_URL,
		}));
	});

	const sendDayCurriculum = async (
		ctx: ContextMessageUpdate,
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

		if (curriculum[today]) {
			await ctx.replyWithMarkdown([
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
			].join('\n'));
		} else {
			await ctx.replyWithMarkdown(prefix + '\n' + locale(`replies.curriculum.${type}.empty`));
		}
	};

	const sendWeekCurriculum = async (
		ctx: ContextMessageUpdate,
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

		await ctx.replyWithMarkdown([
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
		].join('\n'));
	};

	bot.hears(/^(.*): (.*)$/, async ctx => {
		const [, groupName, actionName] = ctx.match!;

		const curriculum = await api.groupCurriculum(groupName);

		if (!curriculum) {
			return await sendSomethingWentWrong(ctx, locale, locale('errors.unknown-group'));
		}

		switch (actionName) {
		case locale('buttons.curriculum.today'):
			await sendDayCurriculum(
				ctx,
				'today',
				groupName,
				curriculum,
				getNow(),
			);
			break;
		case locale('buttons.curriculum.tomorrow'): {
			await sendDayCurriculum(
				ctx,
				'tomorrow',
				groupName,
				curriculum,
				addDays(getNow(), 1),
			);
			break;
		}
		case locale('buttons.curriculum.week'):
			await sendWeekCurriculum(
				ctx,
				'week',
				groupName,
				curriculum,
				getNow(),
			);
			break;
		case locale('buttons.curriculum.next-week'):
			await sendWeekCurriculum(
				ctx,
				'next-week',
				groupName,
				curriculum,
				addDays(getNow(), 7),
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
};
