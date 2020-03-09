import path from 'path';

import fs from 'fs-extra';
import yaml from 'js-yaml';

export type Locale = (key: string, params?: Record<string, string>) => string;
type LocaleItem = (params: Record<string, string>) => string;

const compileExpression = (exp: string): LocaleItem => {
	let last = 0;
	const items = [];

	for (const match of exp.matchAll(/(?<!\{)\{([^\{\}]+)\}/gi)) {
		const str = exp.substring(last, match.index);
		last = match.index! + match[0].length;
		items.push(JSON.stringify(str));

		const [, name] = match;
		items.push(`(__params[${JSON.stringify(name)}] || ${JSON.stringify('{' + name + '}')})`);
	}

	if (last < exp.length) {
		items.push(JSON.stringify(exp.substring(last)));
	}

	const source = 'return ' + items.join('+');

	return new Function('__params', source) as LocaleItem;
};

export const readLocale = async (name: string): Promise<Locale> => {
	const filename = path.join(__dirname, `${name}.yml`);

	const data = yaml.safeLoad(await fs.readFile(filename, 'utf-8'), {
		filename,
	});

	const items = new Map<string, LocaleItem>();

	const walk = (prefix: string, obj: object) => {
		for (const [key, value] of Object.entries(obj)) {
			if (typeof value === 'object') {
				walk(prefix + key + '.', value);
			} else {
				items.set(prefix + key, compileExpression(String(value)));
			}
		}
	};

	walk('', data);

	const emptyObj = Object.create(null);

	return (key: string, params: Record<string, string> = emptyObj) => {
		if (items.has(key)) {
			return items.get(key)!(params);
		} else {
			return key;
		}
	};
};
