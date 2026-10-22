/* Web: what people say about your shows. The dirt sheet (a weekly newsletter), the weekly podcast (two hosts talk
   through the week, with captions) and the boards (the fan message board), all on one page. All of it is information: nothing to decide here. */
import { ComponentChildren } from 'preact';
import { Modal } from '../../store';
import { Web } from './Web';
import { PodPlayer } from './PodPlayer';

export const pages: Record<string, () => ComponentChildren> = { web: Web };
export const modals: Record<string, (p: { m: Modal }) => ComponentChildren> = { podcast: PodPlayer };
