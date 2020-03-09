import * as t from 'io-ts';

export const Ring = t.exact(t.type({
	start: t.string,
	end: t.string,
}));

export type Ring = t.TypeOf<typeof Ring>;


export const Setting = t.exact(t.type({
	key: t.string,
	value: t.string,
}));

export type Setting = t.TypeOf<typeof Setting>;


export const Group = t.exact(t.type({
	name: t.string,
	url: t.string,
}));

export type Group = t.TypeOf<typeof Group>;


export const GlobalSettings = t.exact(t.type({
	rings: t.array(Ring),
	settings: t.array(Setting),
	groups: t.array(Group),
}));

export type GlobalSettings = t.TypeOf<typeof GlobalSettings>;
