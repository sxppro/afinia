import { TZDateMini } from '@date-fns/tz';
import { startOfDay } from 'date-fns';

export const TZ = 'Australia/Melbourne';

export const getStartOfDay = () => startOfDay(TZDateMini.tz(TZ));

export const now = () => TZDateMini.tz(TZ);
