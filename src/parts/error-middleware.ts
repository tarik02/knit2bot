import { ContextMessageUpdate, Middleware } from 'telegraf';

import { Locale } from '../locales/Locale';

class SilentError extends Error {
}

export const sendSomethingWentWrong = async (ctx: ContextMessageUpdate, locale: Locale, info?: string): Promise<never> => {
	if (info === undefined) {
		info = locale('errors.default');
	}

	await ctx.reply(locale('errors.template', {
		text: info,
	}));

	throw new SilentError();
};

export const errorMiddleware = <TContext extends ContextMessageUpdate>(locale: Locale): Middleware<TContext> => (
	async (ctx, next) => {
		try {
			await next!();
		} catch (e) {
			if (!(e instanceof SilentError)) {
				try {
					await sendSomethingWentWrong(ctx, locale);
				} catch {
				}

				throw e;
			}
		}
	}
);
