import path from 'path';

import dotenv from 'dotenv';
import fs from 'fs-extra';
import * as t from 'io-ts';
import { isLeft, parseJSON, toError, Either } from 'fp-ts/lib/Either';

export const Env = t.intersection([
	t.exact(t.type({
		BOT_TOKEN: t.string,

		SHEETS_API_TOKEN: t.string,
		SHEETS_ROOT_URL: t.string,
		SHEETS_EXAMPLE_URL: t.string,

		LOCALE: t.string,

		MAINTAINER_ID: new t.Type<number, string, unknown>(
			'number',
			(it): it is number => typeof it === 'number',
			it => parseJSON(String(it), toError) as Either<t.Errors, number>,
			it => `${it}`,
		),
		MAINTAINER_USERNAME: t.string,
	})),
	t.union([
		t.exact(t.type({
			BOT_MODE: t.literal('polling'),
		})),
		t.exact(t.type({
			BOT_MODE: t.literal('webhook'),
			BOT_WEBHOOK_URL: t.string,
			BOT_WEBHOOK_PORT: t.string,
		})),
		t.exact(t.type({
			BOT_MODE: t.literal('now'),
		})),
	]),
]);

export type Env = t.TypeOf<typeof Env>;

export const readEnv = async (): Promise<Env> => {
	const envFile = path.join(__dirname, '../.env');

	const env = (await fs.stat(envFile).then(it => it.isFile).catch(() => false))
		? dotenv.parse(await fs.readFile(envFile))
		: {}
	;

	const result = Env.decode({
		...process.env,
		...env,
	});

	if (isLeft(result)) {
		throw result.left;
	}

	return result.right;
};
