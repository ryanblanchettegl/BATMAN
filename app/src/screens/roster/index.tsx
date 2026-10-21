/* The Roster section: everything about talent. Who you have, how they feel, what they hold, who you could sign. */
import { ComponentChildren } from 'preact';
import { Modal } from '../../store';
import { Roster } from './Roster';
import { Locker } from './Locker';
import { Titles } from './Titles';
import { Market } from './Market';
import { PlayerModal } from '../player/modal';
import { ScoutWindow } from './Profile';
import { StaffWindow, ToStaffWindow } from './Staff';
import { AttrWindow } from './Attrs';

export const pages: Record<string, () => ComponentChildren> = { roster: Roster, locker: Locker, titles: Titles, market: Market };
export const modals: Record<string, (p: { m: Modal }) => ComponentChildren> = { scout: ScoutWindow, player: PlayerModal, staff: StaffWindow, tostaff: ToStaffWindow, attrs: AttrWindow };
