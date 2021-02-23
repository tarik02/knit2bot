export const cleanDayName = (input: string) => input
	.replace(/[^\p{L}]/ug, '')
	.toLowerCase();
