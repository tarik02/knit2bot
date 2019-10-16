import FuzzySearch from 'fuzzy-search';
import Telegraf, { ContextMessageUpdate, Markup } from 'telegraf';
import _ from 'lodash';
import moment from 'moment-timezone';

import { curriculums, groups, Day, ringTimes } from './curriculum';
import { getCurrentHalf } from './date-util';
import {
	printDayCurriculum,
	multilinePad,
	indicify,
	printHalfName,
	printWeekCurriculum,
} from './print';
import { memoized } from './util';


const MAX_BUTTONS_PER_ROW = 8;

class SilentError extends Error { }

const sendSomethingWentWrong = async (ctx: ContextMessageUpdate, info?: string): Promise<never> => {
	if (info !== undefined) {
		await ctx.reply(':( ' + info);
	} else {
		await ctx.reply(':( Щось пішло не так...');
	}

	throw new SilentError();
};

const getButtonsPerRowCount = (totalCount: number, maxPerRow: number = MAX_BUTTONS_PER_ROW): number => {
	// would be cool to have a square set of buttons
	const goodPerRowCount = Math.floor(Math.sqrt(totalCount));

	const result = _.range(3, totalCount)
		.map(i =>
			totalCount % i == 0 && totalCount / i >= 3
				? totalCount / i
				: undefined
		)
		.filter((it): it is number => it !== undefined)
		.filter(it => it <= maxPerRow)
		.concat(goodPerRowCount)[0]!
	;

	return Math.min(
		maxPerRow,
		result,
	);
};

type Action = {
	title: string;
	suffix?: string;
	indent?: false;
	text: string;
};

const alignButtons = <T>(buttons: T[], maxPerRow: number = MAX_BUTTONS_PER_ROW): T[][] => {
	if (buttons.length <= 3) {
		return [buttons];
	}

	return _.chunk(buttons, getButtonsPerRowCount(buttons.length, maxPerRow));
};

const printActionText = (action: Action): string => (
	`*=== ${action.title + (action.suffix || '')} ===*\n` +
	multilinePad(action.text, action.indent !== false ? '    ' : '')
);

const renderer = () => {
	const now = moment();
	const today = Day[now.day() - 1];
	const tomorrow = Day[now.day() % 7];
	const half = getCurrentHalf(now);
	const halfName = half !== undefined ? printHalfName(half) : '';
	const otherHalfName = half !== undefined ? printHalfName(half === 0 ? 1 : 0) : '';

	return {
		common: [
			{
				title: `Дзвінки`,
				text: indicify(ringTimes.join('\n')),
			},
		],

		..._.fromPairs(groups.map(group => {
			return [group, (half === undefined) ? [] : [
				curriculums[group][today] ? {
					title: `${group}: Пари сьогодні`,
					suffix: ` [${today}, ${halfName}]`,
					text: printDayCurriculum(curriculums[group][today]!, half),
				} : undefined,

				curriculums[group][tomorrow] ? {
					title: `${group}: Пари завтра`,
					suffix: ` [${tomorrow}, ${halfName}]`,
					text: printDayCurriculum(curriculums[group][tomorrow]!, half),
				} : undefined,

				{
					title: `${group}: Пари тижня`,
					suffix: ` [${halfName}]`,
					indent: false,
					text: printWeekCurriculum(curriculums[group], half),
				},

				{
					title: `${group}: Пари наступного тижня`,
					suffix: ` [${otherHalfName}]`,
					indent: false,
					text: printWeekCurriculum(curriculums[group], half === 0 ? 1 : 0),
				},
			]];
		})),
	} as Record<string, ReadonlyArray<Action>>;
};

export const main = async (bot: Telegraf<ContextMessageUpdate>) => {
	const me = await bot.telegram.getMe();
	bot.options.username = me.username;

	bot.catch(console.error);

	bot.use(async (ctx, next) => {
		try {
			await next!();
		} catch (e) {
			if (!(e instanceof SilentError)) {
				try {
					await sendSomethingWentWrong(ctx);
				} catch {
				}

				throw e;
			}
		}
	});

	const render = memoized(renderer, 5 * 60 * 1000);

	bot.start(async ctx => {
		const extra = Markup
			.keyboard(alignButtons(groups))
			.oneTime(false)
			.resize(true)
			.extra()
			;
		await ctx.reply('Виберіть групу', extra);
	});

	bot.hears(/^(Меню|Назад)$/, async ctx => {
		const extra = Markup
			.keyboard(alignButtons(groups))
			.oneTime(false)
			.resize(true)
			.extra()
			;
		await ctx.reply('Виберіть групу', extra);
	});

	bot.on('text', async ctx => {
		if (!ctx.chat || ctx.chat.type !== 'private') {
			return;
		}

		const actions = render();
		const text = ctx.message!.text!;

		if (groups.includes(text)) {
			const buttons = [
				...alignButtons(actions[text].map(it => it.title), 2),
				...alignButtons([
					...actions['common'].map(it => it.title),
					'Меню',
				], 2),
			];

			const extra = Markup
				.keyboard(buttons)
				.oneTime(false)
				.resize(true)
				.extra()
				;
			await ctx.reply('Що потрібно?', extra);
		} else {
			const match = text.match(/^(.*): .*$/);
			if (match) {
				const [, group] = match;

				if (!(group in actions)) {
					return await sendSomethingWentWrong(ctx);
				}

				const action = actions[group].find(it => it.title === text);
				if (action === undefined) {
					return await sendSomethingWentWrong(ctx);
				}

				await ctx.replyWithMarkdown(printActionText(action));
			} else {
				const action = actions['common'].find(it => it.title === text);
				if (action === undefined) {
					return await sendSomethingWentWrong(ctx);
				}

				await ctx.replyWithMarkdown(printActionText(action));
			}
		}

		return;
	});

	bot.on('inline_query', async ctx => {
		const actions = render();
		const searcher = new FuzzySearch(_.flatten(Object.values(actions)), [
			'title',
		], {
			caseSensitive: false,
			sort: true,
		});

		await ctx.answerInlineQuery((
			searcher.search(ctx.inlineQuery!.query)
				.filter((result): result is Action => result !== undefined)
				.map(action => ({
					type: 'article',
					id: Buffer.from(action.title, 'utf8').toString('hex').substring(0, 64),
					title: action.title,
					input_message_content: {
						message_text: printActionText(action),
						parse_mode: 'Markdown',
					},
				}))
				.slice(0, 50)
		), {
			cache_time: process.env.NODE_ENV === 'development' ? 0 : 30,
			is_personal: false,
		});
	});
};
