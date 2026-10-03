/* Net: what people say about your shows. The dirt sheet (a weekly newsletter), the feed (short posts from wrestlers,
   companies, the press and fans) and the boards (the fan message board). All of it is information: nothing to decide here. */
import { ComponentChildren } from 'preact';
import { Modal } from '../../store';
import { Sheet } from './Sheet';
import { Feed } from './Feed';
import { Boards } from './Boards';

export const pages: Record<string, () => ComponentChildren> = { sheet: Sheet, feed: Feed, boards: Boards };
export const modals: Record<string, (p: { m: Modal }) => ComponentChildren> = {};
