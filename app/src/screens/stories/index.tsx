/* Stories: what your booking set in motion (Storylines) and what it added up to (History). What people say about it is the Net section. */
import { ComponentChildren } from 'preact';
import { Modal } from '../../store';
import { Storylines, PlotWindow } from './Storylines';
import { History } from './History';
import { StoryWindow } from './StartStory';

export const pages: Record<string, () => ComponentChildren> = { storylines: Storylines, history: History };
export const modals: Record<string, (p: { m: Modal }) => ComponentChildren> = { plot: PlotWindow, story: StoryWindow };
