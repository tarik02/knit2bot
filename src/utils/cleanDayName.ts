export const cleanDayName = (input: string) => input
	.replace(/['"` \t\n\r]/, '')
	.toLowerCase();
