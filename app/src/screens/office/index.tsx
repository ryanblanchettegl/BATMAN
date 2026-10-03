/* The Office section: the desk (which opens on what to do before the show) and Career, plus the week-closed and clock windows and the game-over screen. */
import { ComponentChildren } from 'preact';
import { Modal } from '../../store';
import { Desk } from './Desk';
import { Career } from './Career';
import { WeekClosed, ClockWindow, AnnualReport } from './Windows';

export const pages: Record<string, () => ComponentChildren> = { desk: Desk, career: Career };
export const modals: Record<string, (p: { m: Modal }) => ComponentChildren> = { weekclosed: WeekClosed, annual: AnnualReport, clock: ClockWindow };
export { GameOver } from './GameOver';
