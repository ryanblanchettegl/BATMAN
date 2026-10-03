/* The Roster section: everything about talent. Who you have, how they feel, what they hold, who you could sign. */
import { ComponentChildren } from 'preact';
import { Modal } from '../../store';
import { Roster } from './Roster';
import { Locker } from './Locker';
import { Titles } from './Titles';
import { Market } from './Market';
import { Creator } from './Creator';
import { ScoutWindow } from './Profile';

export const pages: Record<string, () => ComponentChildren> = { roster: Roster, locker: Locker, titles: Titles, market: Market };
export const modals: Record<string, (p: { m: Modal }) => ComponentChildren> = { scout: ScoutWindow, caw: Creator };
