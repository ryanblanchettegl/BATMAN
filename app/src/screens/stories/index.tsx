/* Stories: what your booking set in motion (Storylines), what it added up to (History) and what the fans say (The Net). */
import { ComponentChildren } from 'preact';
import { Modal } from '../../store';
import { Storylines } from './Storylines';
import { History } from './History';
import { Net } from './Net';

export const pages: Record<string, () => ComponentChildren> = { storylines: Storylines, history: History, net: Net };
export const modals: Record<string, (p: { m: Modal }) => ComponentChildren> = {};
