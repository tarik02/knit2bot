import { NowRequest, NowResponse } from '@now/node';
import Telegraf from 'telegraf';

import { main } from '../src/bot';
import { readEnv } from '../src/env';

const webhookCallbackPromise = (async () => {
	const env = await readEnv();

	const bot = new Telegraf(env.BOT_TOKEN);

	await main(env, bot);

	return bot.webhookCallback('/' + env.BOT_TOKEN);
})();

export default function(req: NowRequest, res: NowResponse) {
	if (req.body === undefined) {
		res.send('Nothing to see here...');
	} else {
		webhookCallbackPromise.then(cb => cb(req, res));
	}
};
