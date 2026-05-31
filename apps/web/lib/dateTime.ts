import { TZDateMini } from '@date-fns/tz';
import { startOfDay } from 'date-fns';
import { TZ } from './constants';

export const getStartOfDay = () => startOfDay(TZDateMini.tz(TZ));

export const now = () => TZDateMini.tz(TZ);
