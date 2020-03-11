import { createHash } from 'crypto';

export const hash = (value: any): string => createHash('md5').update(JSON.stringify(value)).digest('hex');
